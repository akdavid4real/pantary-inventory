import 'dotenv/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  IngredientCategory,
  MealType,
  Prisma,
  PrismaClient,
  RecipeCategory,
  RecipeModerationStatus,
  RecipeStatus,
  StorageLocation,
  UserRole,
} from '@prisma/client';
import { normalizeText, slugify } from '../src/common/utils/string.utils';

type JsonRecord = Record<string, any>;

type CatalogDocument = {
  batchId: string;
  catalogVersion: string;
};

type CatalogIngredient = {
  ingredientId: string;
  displayName: string;
  category: string;
  aliases?: string[];
  season?: string[];
  substitutes?: string[];
  allergens?: string[];
  isPantryItem?: boolean;
  pantryPriority?: number;
  essential?: boolean;
  defaultPrice?: number;
  packageQuantity?: number;
  packageUnit?: string;
  currency?: string;
  priceRegion?: string;
  lastUpdatedAt?: string;
  priceEditable?: boolean;
};

type CatalogRecipeIngredient = {
  ingredientId: string;
  displayName: string;
  quantity: number;
  unit: string;
  optional?: boolean;
  notes?: string;
};

type CatalogRecipe = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  region?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: string;
  ingredients?: CatalogRecipeIngredient[];
  instructions?: Array<{ step?: number; text?: string } | string>;
  sourceReferences?: JsonRecord[];
  imageUrl?: string | null;
  localAssetHint?: string | null;
  reviewStatus?: string;
  mealType?: string[];
  spiceLevel?: string;
  cuisine?: string;
  season?: string[];
  difficultyScore?: number;
  batchId: string;
  catalogVersion: string;
};

type CatalogConversion = {
  ingredientId: string;
  localUnit: string;
  standardEquivalent: { quantity: number; unit: string };
  notes?: string;
};

type Catalog = {
  ingredients: CatalogIngredient[];
  recipes: CatalogRecipe[];
  conversions: CatalogConversion[];
  batchFiles: string[];
  warnings: string[];
};

type ImageResolution = {
  url?: string;
  objectPath?: string;
  localPath?: string;
  status: 'existing-db' | 'matched-storage' | 'local-only' | 'missing' | 'ambiguous';
  candidates?: string[];
};

type ImportOptions = {
  apply: boolean;
  reconcile: boolean;
  storageCheck: boolean;
  json: boolean;
};

const prisma = new PrismaClient();
const repositoryRoot = path.resolve(__dirname, '../..');
const infoDirectory = path.resolve(process.env.CATALOG_INFO_DIR ?? path.join(repositoryRoot, 'info'));
const assetDirectory = path.resolve(process.env.CATALOG_ASSET_DIR ?? path.join(repositoryRoot, 'assets'));
const legacyImageBucket = process.env.CATALOG_IMAGE_BUCKET?.trim();
const recipeImageBucket = process.env.CATALOG_RECIPE_IMAGE_BUCKET?.trim() || legacyImageBucket || 'recipe-images';
const ingredientImageBucket = process.env.CATALOG_INGREDIENT_IMAGE_BUCKET?.trim() || legacyImageBucket || 'ingredient-images';
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

function readOptions(): ImportOptions {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply');
  return {
    apply,
    reconcile: apply || args.has('--reconcile'),
    storageCheck: args.has('--storage-check'),
    json: args.has('--json'),
  };
}

async function loadCatalog(): Promise<Catalog> {
  const fileNames = (await fs.readdir(infoDirectory))
    .filter((fileName) => /^catalog_batch_\d+_completed\.json$/i.test(fileName))
    .sort();
  if (!fileNames.length) throw new Error(`No completed catalog batches found in ${infoDirectory}.`);

  const ingredientById = new Map<string, CatalogIngredient>();
  const recipeById = new Map<string, CatalogRecipe>();
  const recipeSlugOwner = new Map<string, string>();
  const conversions = new Map<string, CatalogConversion>();
  const warnings: string[] = [];

  for (const fileName of fileNames) {
    const parsed = JSON.parse(await fs.readFile(path.join(infoDirectory, fileName), 'utf8')) as JsonRecord;
    const document = parsed.document as CatalogDocument;
    if (!document?.batchId || !document?.catalogVersion) {
      throw new Error(`${fileName} is missing document.batchId or document.catalogVersion.`);
    }

    for (const ingredient of (parsed.ingredientMaster ?? []) as CatalogIngredient[]) {
      const current = ingredientById.get(ingredient.ingredientId);
      if (current && JSON.stringify(current) !== JSON.stringify(ingredient)) {
        warnings.push(`${ingredient.ingredientId} is redefined in ${fileName}; the latest definition is used.`);
      }
      ingredientById.set(ingredient.ingredientId, ingredient);
    }

    const commonConversions = (parsed.unitConversions?.common ?? []) as CatalogConversion[];
    for (const conversion of commonConversions) {
      const key = `${conversion.ingredientId}:${conversion.localUnit}:${conversion.standardEquivalent.unit}`;
      conversions.set(key, conversion);
    }

    for (const sourceRecipe of (parsed.recipes ?? []) as Omit<CatalogRecipe, 'batchId' | 'catalogVersion'>[]) {
      if (!sourceRecipe.id || !sourceRecipe.slug) throw new Error(`${fileName} contains a recipe without id or slug.`);
      if (recipeById.has(sourceRecipe.id)) throw new Error(`Duplicate recipe id: ${sourceRecipe.id}.`);
      const slugOwner = recipeSlugOwner.get(sourceRecipe.slug);
      if (slugOwner) throw new Error(`Duplicate recipe slug ${sourceRecipe.slug} (${slugOwner}, ${sourceRecipe.id}).`);
      recipeSlugOwner.set(sourceRecipe.slug, sourceRecipe.id);
      recipeById.set(sourceRecipe.id, {
        ...sourceRecipe,
        batchId: document.batchId,
        catalogVersion: document.catalogVersion,
      });
    }
  }

  const referencedIngredientIds = new Set(
    [...recipeById.values()].flatMap((recipe) => (recipe.ingredients ?? []).map((item) => item.ingredientId)),
  );
  for (const ingredientId of referencedIngredientIds) {
    if (!ingredientById.has(ingredientId)) throw new Error(`Recipe ingredient ${ingredientId} has no ingredientMaster record.`);
  }

  return {
    ingredients: [...ingredientById.values()].sort((a, b) => a.ingredientId.localeCompare(b.ingredientId)),
    recipes: [...recipeById.values()].sort((a, b) => a.slug.localeCompare(b.slug)),
    conversions: [...conversions.values()],
    batchFiles: fileNames,
    warnings,
  };
}

async function listFilesRecursively(directory: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await listFilesRecursively(fullPath));
    else output.push(fullPath);
  }
  return output;
}

function assertSafeBucketName(bucket: string) {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(bucket)) throw new Error(`Unsafe Supabase bucket name: ${bucket}.`);
}

async function listStorageObjectsWithApi(bucket: string, prefix = ''): Promise<string[]> {
  if (!supabaseUrl || !serviceRoleKey) return [];
  assertSafeBucketName(bucket);
  const objects: string[] = [];
  const queue = [prefix];

  while (queue.length) {
    const currentPrefix = queue.shift()!;
    let offset = 0;
    while (true) {
      const response = await fetch(`${supabaseUrl}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefix: currentPrefix, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`Could not list Supabase bucket ${bucket}: ${await response.text()}`);
      const entries = await response.json() as Array<{ id?: string | null; name: string; metadata?: unknown }>;
      for (const entry of entries) {
        const objectPath = currentPrefix ? `${currentPrefix}/${entry.name}` : entry.name;
        if (entry.id || entry.metadata) objects.push(objectPath);
        else queue.push(objectPath);
      }
      if (entries.length < 1000) break;
      offset += entries.length;
    }
  }
  return objects;
}

function objectsFromVerifiedCliLayout(bucket: string, localFiles: string[]) {
  if (bucket === recipeImageBucket) {
    return localFiles
      .filter((file) => file.toLowerCase().includes(`${path.sep}foods${path.sep}`))
      .filter((file) => {
        const name = path.basename(file);
        const number = Number(name.match(/^(\d+)-/)?.[1]);
        return (Number.isFinite(number) && number <= 60) || name === 'jollof-rice-grilled-chicken-hero.png';
      })
      .map((file) => path.basename(file));
  }
  if (bucket === ingredientImageBucket) {
    return localFiles
      .filter((file) => file.toLowerCase().includes(`${path.sep}ingredients${path.sep}`))
      .map((file) => `ingredients/${path.basename(file)}`);
  }
  throw new Error(`No verified CLI layout is available for bucket ${bucket}.`);
}

async function listStorageObjects(bucket: string, localFiles: string[]) {
  return serviceRoleKey
    ? listStorageObjectsWithApi(bucket)
    : objectsFromVerifiedCliLayout(bucket, localFiles);
}

function publicObjectUrl(bucket: string, objectPath: string): string | undefined {
  if (!supabaseUrl) return undefined;
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}

function resolveImage(
  existingUrl: string | null | undefined,
  localPath: string | undefined,
  storageObjects: string[],
  bucket: string,
  preferredPrefix: string,
  identityKeys: string[],
): ImageResolution {
  if (existingUrl) return { url: existingUrl, status: 'existing-db', localPath };
  const localBaseName = localPath ? path.basename(localPath).toLowerCase() : undefined;
  const normalizedIdentities = new Set(identityKeys.map((value) => slugify(value)));
  const candidates = storageObjects.filter((objectPath) => {
    const baseName = path.basename(objectPath).toLowerCase();
    if (localBaseName && baseName === localBaseName) return true;
    const identity = path.basename(baseName, path.extname(baseName)).replace(/^\d+-/, '');
    return normalizedIdentities.has(identity);
  });
  const preferredPath = localBaseName
    ? `${preferredPrefix ? `${preferredPrefix}/` : ''}${localBaseName}`
    : undefined;
  const preferred = preferredPath ? candidates.find((candidate) => candidate.toLowerCase() === preferredPath) : undefined;
  if (preferred) {
    return {
      url: publicObjectUrl(bucket, preferred),
      objectPath: preferred,
      localPath,
      status: 'matched-storage',
    };
  }
  if (candidates.length === 1) {
    return {
      url: publicObjectUrl(bucket, candidates[0]),
      objectPath: candidates[0],
      localPath,
      status: 'matched-storage',
    };
  }
  if (candidates.length > 1) return { status: 'ambiguous', localPath, candidates };
  return localPath ? { status: 'local-only', localPath } : { status: 'missing' };
}

function ingredientAssetByCatalogId(ingredients: CatalogIngredient[], localFiles: string[]) {
  const assetByKey = new Map<string, string>();
  for (const file of localFiles.filter((item) => item.toLowerCase().includes(`${path.sep}ingredients${path.sep}`))) {
    const normalized = path.basename(file, path.extname(file)).replace(/^\d+-/, '');
    assetByKey.set(normalized, file);
  }
  const lookup = new Map<string, string>();
  for (const ingredient of ingredients) {
    const exact = assetByKey.get(ingredient.ingredientId);
    if (exact) {
      lookup.set(ingredient.ingredientId, exact);
      continue;
    }
    const candidates = new Set(
      [ingredient.displayName, ...(ingredient.aliases ?? [])]
        .map((value) => slugify(value))
        .flatMap((key) => assetByKey.get(key) ? [assetByKey.get(key)!] : []),
    );
    if (candidates.size === 1) lookup.set(ingredient.ingredientId, [...candidates][0]);
  }
  return lookup;
}

function recipeLocalAsset(recipe: CatalogRecipe): string | undefined {
  if (!recipe.localAssetHint) return undefined;
  return path.resolve(repositoryRoot, recipe.localAssetHint.replaceAll('/', path.sep));
}

function normalizeUnit(unit: string | undefined): string {
  const key = (unit ?? '').trim().toUpperCase();
  const units: Record<string, string> = {
    GRAM: 'g',
    KILOGRAM: 'kg',
    MILLILITRE: 'ml',
    LITRE: 'l',
    PIECE: 'piece',
    CUP: 'cup',
    DERICA: 'derica',
    CIGAR_CUP: 'cigar cup',
    COOKING_SPOON: 'cooking spoon',
  };
  return units[key] ?? key.toLowerCase().replaceAll('_', ' ');
}

function ingredientDefaultUnit(ingredient: CatalogIngredient, recipes: CatalogRecipe[]) {
  const recipeUnit = recipes
    .flatMap((recipe) => recipe.ingredients ?? [])
    .find((item) => item.ingredientId === ingredient.ingredientId)?.unit;
  if (recipeUnit) return normalizeUnit(recipeUnit);
  return normalizeUnit(ingredient.packageUnit) === 'l' ? 'ml'
    : normalizeUnit(ingredient.packageUnit) === 'kg' ? 'g'
      : normalizeUnit(ingredient.packageUnit) || 'g';
}

function ingredientCategory(ingredient: CatalogIngredient): IngredientCategory {
  const direct: Record<string, IngredientCategory> = {
    PROTEIN: IngredientCategory.PROTEIN,
    VEGETABLE: IngredientCategory.VEGETABLES,
    LEAF: IngredientCategory.VEGETABLES,
    FRUIT: IngredientCategory.FRUITS,
    SPICE: IngredientCategory.SPICES,
    SEASONING: IngredientCategory.SPICES,
    OIL: IngredientCategory.OIL,
    LEGUME: IngredientCategory.LEGUMES,
    SEAFOOD: IngredientCategory.SEAFOOD,
    OTHER: IngredientCategory.OTHER,
  };
  if (ingredient.category !== 'STAPLE') return direct[ingredient.category] ?? IngredientCategory.OTHER;
  if (/(garri|flour|semovita|fufu|swallow|starch|pupuru|lafun)/.test(ingredient.ingredientId)) return IngredientCategory.SWALLOW;
  if (/(yam|cassava|cocoyam|potato)/.test(ingredient.ingredientId)) return IngredientCategory.TUBERS;
  return IngredientCategory.GRAINS;
}

function recipeCategory(value?: string): RecipeCategory {
  return Object.values(RecipeCategory).includes(value as RecipeCategory)
    ? value as RecipeCategory
    : RecipeCategory.OTHER;
}

function mealTypes(values?: string[]): MealType[] {
  return (values ?? []).filter((value): value is MealType => Object.values(MealType).includes(value as MealType));
}

function uniqueAliases(ingredient: CatalogIngredient) {
  const values = [ingredient.displayName, ingredient.ingredientId, ...(ingredient.aliases ?? [])];
  const seen = new Set<string>();
  return values
    .map((alias) => alias.trim())
    .filter(Boolean)
    .filter((alias) => {
      const normalized = normalizeText(alias);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function localSummary(catalog: Catalog, localFiles: string[]) {
  const ingredientAssets = ingredientAssetByCatalogId(catalog.ingredients, localFiles);
  const recipeAssets = catalog.recipes.map((recipe) => recipeLocalAsset(recipe));
  const existingRecipeAssets = recipeAssets.filter(Boolean).filter((file) => localFiles.includes(file!));
  const statuses = Object.fromEntries(
    [...new Set(catalog.recipes.map((recipe) => recipe.reviewStatus ?? 'Unknown'))]
      .sort()
      .map((status) => [status, catalog.recipes.filter((recipe) => (recipe.reviewStatus ?? 'Unknown') === status).length]),
  );
  return {
    mode: 'local-dry-run',
    batches: catalog.batchFiles.length,
    batchFiles: catalog.batchFiles,
    recipes: catalog.recipes.length,
    ingredients: catalog.ingredients.length,
    conversions: catalog.conversions.length,
    reviewStatuses: statuses,
    localRecipeImagesMatched: existingRecipeAssets.length,
    localRecipeImagesMissingHint: recipeAssets.filter((file) => !file).length,
    localIngredientImagesMatched: catalog.ingredients.filter((ingredient) => ingredientAssets.has(ingredient.ingredientId)).length,
    warnings: catalog.warnings,
  };
}

async function reconcileAndMaybeApply(catalog: Catalog, localFiles: string[], options: ImportOptions) {
  // CLI storage listings are intentionally sequential because concurrent CLI
  // processes can contend on the Windows telemetry cache file.
  const recipeStorageObjects = await listStorageObjects(recipeImageBucket, localFiles);
  const ingredientStorageObjects = await listStorageObjects(ingredientImageBucket, localFiles);
  const [existingIngredients, existingRecipes] = await Promise.all([
    prisma.ingredient.findMany({ include: { aliases: true } }),
    prisma.recipe.findMany({ select: { id: true, slug: true, catalogId: true, imageUrl: true, createdByUserId: true } }),
  ]);
  const ingredientAssets = ingredientAssetByCatalogId(catalog.ingredients, localFiles);
  const existingIngredientByCatalogId = new Map(existingIngredients.flatMap((item) => item.catalogId ? [[item.catalogId, item] as const] : []));
  const existingIngredientCandidates = new Map<string, Set<(typeof existingIngredients)[number]>>();
  for (const ingredient of existingIngredients) {
    const values = [ingredient.slug, ingredient.name, ...ingredient.aliases.map((alias) => alias.alias)];
    for (const value of values) {
      const key = normalizeText(value);
      const set = existingIngredientCandidates.get(key) ?? new Set();
      set.add(ingredient);
      existingIngredientCandidates.set(key, set);
    }
  }
  const ingredientMatches = new Map<string, (typeof existingIngredients)[number] | undefined>();
  const ingredientConflicts: string[] = [];
  for (const ingredient of catalog.ingredients) {
    const byCatalogId = existingIngredientByCatalogId.get(ingredient.ingredientId);
    if (byCatalogId) {
      ingredientMatches.set(ingredient.ingredientId, byCatalogId);
      continue;
    }
    const matches = new Set<(typeof existingIngredients)[number]>();
    for (const alias of uniqueAliases(ingredient)) {
      for (const match of existingIngredientCandidates.get(normalizeText(alias)) ?? []) matches.add(match);
    }
    if (matches.size > 1) ingredientConflicts.push(`${ingredient.ingredientId}: ${[...matches].map((item) => item.slug).join(', ')}`);
    ingredientMatches.set(ingredient.ingredientId, matches.size === 1 ? [...matches][0] : undefined);
  }

  const recipeByCatalogId = new Map(existingRecipes.flatMap((item) => item.catalogId ? [[item.catalogId, item] as const] : []));
  const recipeBySlug = new Map(existingRecipes.map((item) => [item.slug, item]));
  const recipeMatches = new Map<string, (typeof existingRecipes)[number] | undefined>();
  const recipeConflicts: string[] = [];
  for (const recipe of catalog.recipes) {
    const match = recipeByCatalogId.get(recipe.id) ?? recipeBySlug.get(recipe.slug);
    if (match?.createdByUserId && match.catalogId !== recipe.id) {
      recipeConflicts.push(`${recipe.id}: slug ${recipe.slug} belongs to user-owned recipe ${match.id}`);
    }
    recipeMatches.set(recipe.id, match);
  }

  const recipeImages = new Map<string, ImageResolution>();
  for (const recipe of catalog.recipes) {
    const match = recipeMatches.get(recipe.id);
    recipeImages.set(recipe.id, resolveImage(
      match?.imageUrl,
      recipeLocalAsset(recipe),
      recipeStorageObjects,
      recipeImageBucket,
      '',
      [recipe.id, recipe.slug, recipe.name],
    ));
  }
  const ingredientImages = new Map<string, ImageResolution>();
  for (const ingredient of catalog.ingredients) {
    const match = ingredientMatches.get(ingredient.ingredientId);
    ingredientImages.set(
      ingredient.ingredientId,
      resolveImage(
        match?.imageUrl,
        ingredientAssets.get(ingredient.ingredientId),
        ingredientStorageObjects,
        ingredientImageBucket,
        'ingredients',
        [ingredient.ingredientId, ingredient.displayName, ...(ingredient.aliases ?? [])],
      ),
    );
  }

  const admin = await resolveAdmin(false);
  const summary = {
    mode: options.apply ? 'apply' : 'live-reconcile',
    database: {
      ingredientsToCreate: catalog.ingredients.filter((item) => !ingredientMatches.get(item.ingredientId)).length,
      ingredientsToUpdate: catalog.ingredients.filter((item) => ingredientMatches.get(item.ingredientId)).length,
      recipesToCreate: catalog.recipes.filter((item) => !recipeMatches.get(item.id)).length,
      recipesToUpdate: catalog.recipes.filter((item) => recipeMatches.get(item.id)).length,
      ingredientConflicts,
      recipeConflicts,
    },
    images: summarizeImages([...recipeImages.values()], [...ingredientImages.values()]),
    storage: {
      listingMethod: serviceRoleKey ? 'storage-api' : 'verified-cli-layout',
      recipeBucket: recipeImageBucket,
      recipeObjectsFound: recipeStorageObjects.length,
      ingredientBucket: ingredientImageBucket,
      ingredientObjectsFound: ingredientStorageObjects.length,
    },
    platformAdmin: admin ? { id: admin.id, email: admin.email, found: true } : { found: false },
  };

  if (!options.apply) return summary;
  if (ingredientConflicts.length || recipeConflicts.length) {
    throw new Error('Apply stopped because reconciliation found identity conflicts. Run with --reconcile and resolve them first.');
  }
  if (!supabaseUrl || !recipeImageBucket || !ingredientImageBucket) {
    throw new Error('Apply stopped because SUPABASE_URL and the recipe/ingredient image buckets are required.');
  }
  const platformAdmin = await resolveAdmin(true);
  if (!platformAdmin) throw new Error('Platform Admin could not be resolved.');

  const ingredientIdByCatalogId = new Map<string, string>();
  const aliasOwners = new Map(existingIngredients.flatMap((item) => item.aliases.map((alias) => [alias.normalized, item.id] as const)));
  for (const source of catalog.ingredients) {
    const existing = ingredientMatches.get(source.ingredientId);
    const image = ingredientImages.get(source.ingredientId)!;
    const data = {
      catalogId: source.ingredientId,
      name: source.displayName.trim(),
      slug: existing?.slug ?? slugify(source.ingredientId),
      imageUrl: existing?.imageUrl ?? image.url,
      category: ingredientCategory(source),
      defaultUnit: ingredientDefaultUnit(source, catalog.recipes),
      storageLocation: existing?.storageLocation ?? StorageLocation.PANTRY,
      isPantryItem: source.isPantryItem ?? true,
      pantryPriority: source.pantryPriority,
      essential: source.essential ?? false,
      seasons: source.season ?? [],
      substitutes: source.substitutes ?? [],
      allergens: source.allergens ?? [],
    };
    const ingredient = existing
      ? await prisma.ingredient.update({ where: { id: existing.id }, data })
      : await prisma.ingredient.create({ data });
    ingredientIdByCatalogId.set(source.ingredientId, ingredient.id);

    for (const alias of uniqueAliases(source)) {
      const normalized = normalizeText(alias);
      const owner = aliasOwners.get(normalized);
      if (owner && owner !== ingredient.id) throw new Error(`Alias ${alias} belongs to another ingredient.`);
      await prisma.ingredientAlias.upsert({
        where: { normalized },
        create: { ingredientId: ingredient.id, alias, normalized },
        update: { alias },
      });
      aliasOwners.set(normalized, ingredient.id);
    }

    if (source.defaultPrice !== undefined && source.packageQuantity && source.packageUnit) {
      await prisma.ingredientPriceDefault.upsert({
        where: {
          ingredientId_priceRegion_currency: {
            ingredientId: ingredient.id,
            priceRegion: source.priceRegion ?? 'Nigeria',
            currency: source.currency ?? 'NGN',
          },
        },
        create: {
          ingredientId: ingredient.id,
          priceNaira: source.defaultPrice,
          packageQuantity: source.packageQuantity,
          packageUnit: normalizeUnit(source.packageUnit),
          currency: source.currency ?? 'NGN',
          priceRegion: source.priceRegion ?? 'Nigeria',
          priceEditable: source.priceEditable ?? true,
          effectiveAt: source.lastUpdatedAt ? new Date(source.lastUpdatedAt) : undefined,
          source: 'Pantry-to-Plate Nigerian food catalog',
        },
        update: {
          priceNaira: source.defaultPrice,
          packageQuantity: source.packageQuantity,
          packageUnit: normalizeUnit(source.packageUnit),
          priceEditable: source.priceEditable ?? true,
          effectiveAt: source.lastUpdatedAt ? new Date(source.lastUpdatedAt) : undefined,
          source: 'Pantry-to-Plate Nigerian food catalog',
        },
      });
    }
  }

  for (const conversion of catalog.conversions) {
    const ingredientId = ingredientIdByCatalogId.get(conversion.ingredientId);
    if (!ingredientId) continue;
    await prisma.unitConversion.upsert({
      where: {
        ingredientId_fromUnit_toUnit: {
          ingredientId,
          fromUnit: normalizeUnit(conversion.localUnit),
          toUnit: normalizeUnit(conversion.standardEquivalent.unit),
        },
      },
      create: {
        ingredientId,
        fromUnit: normalizeUnit(conversion.localUnit),
        toUnit: normalizeUnit(conversion.standardEquivalent.unit),
        multiplier: conversion.standardEquivalent.quantity,
        notes: conversion.notes,
      },
      update: { multiplier: conversion.standardEquivalent.quantity, notes: conversion.notes },
    });
  }

  for (const source of catalog.recipes) {
    const existing = recipeMatches.get(source.id);
    const image = recipeImages.get(source.id)!;
    const approved = source.reviewStatus === 'Approved' || source.reviewStatus === 'Submitted';
    const ingredients = (source.ingredients ?? []).map((item) => ({
      ingredientId: ingredientIdByCatalogId.get(item.ingredientId)!,
      quantity: item.quantity,
      unit: normalizeUnit(item.unit),
      isOptional: item.optional ?? false,
      notes: item.notes,
    }));
    const steps = (source.instructions ?? []).map((item, index) => ({
      stepNumber: typeof item === 'string' ? index + 1 : item.step ?? index + 1,
      instruction: typeof item === 'string' ? item : item.text ?? '',
    })).filter((step) => step.instruction.trim());

    await prisma.$transaction(async (tx) => {
      const data = {
        createdByUserId: platformAdmin.id,
        moderatedByUserId: approved ? platformAdmin.id : null,
        catalogId: source.id,
        catalogBatch: source.batchId,
        catalogVersion: source.catalogVersion,
        catalogReviewStatus: source.reviewStatus,
        catalogSourceReferences: (source.sourceReferences ?? []) as Prisma.InputJsonValue,
        localAssetHint: source.localAssetHint,
        mealTypes: mealTypes(source.mealType),
        spiceLevel: source.spiceLevel,
        cuisine: source.cuisine,
        seasons: source.season ?? [],
        difficultyScore: source.difficultyScore,
        catalogImportedAt: new Date(),
        name: source.name,
        slug: existing?.slug ?? source.slug,
        description: source.description,
        category: recipeCategory(source.category),
        region: source.region,
        imageUrl: existing?.imageUrl ?? image.url,
        servings: Math.max(1, source.servings ?? 1),
        prepTimeMinutes: Math.max(0, source.prepTimeMinutes ?? 0),
        cookTimeMinutes: Math.max(0, source.cookTimeMinutes ?? 0),
        difficulty: source.difficulty,
        status: approved ? RecipeStatus.PUBLISHED : RecipeStatus.DRAFT,
        isPublished: approved,
        moderationStatus: approved ? RecipeModerationStatus.APPROVED : RecipeModerationStatus.PENDING,
        moderationNote: approved
          ? `Approved catalog import from ${source.batchId}.`
          : `Seeded by Platform Admin from ${source.batchId}; awaiting image and nutrition review.`,
        moderatedAt: approved ? new Date() : null,
      };
      const recipe = existing
        ? await tx.recipe.update({ where: { id: existing.id }, data })
        : await tx.recipe.create({ data });
      await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
      if (ingredients.length) await tx.recipeIngredient.createMany({ data: ingredients.map((item) => ({ recipeId: recipe.id, ...item })) });
      await tx.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
      if (steps.length) await tx.recipeStep.createMany({ data: steps.map((step) => ({ recipeId: recipe.id, ...step })) });
    }, {
      maxWait: 30_000,
      timeout: 60_000,
    });
  }

  return { ...summary, applied: { ingredients: catalog.ingredients.length, recipes: catalog.recipes.length } };
}

function summarizeImages(recipeImages: ImageResolution[], ingredientImages: ImageResolution[]) {
  const count = (items: ImageResolution[]) => Object.fromEntries(
    ['existing-db', 'matched-storage', 'local-only', 'missing', 'ambiguous'].map((status) => [
      status,
      items.filter((item) => item.status === status).length,
    ]),
  );
  return { recipes: count(recipeImages), ingredients: count(ingredientImages) };
}

async function resolveAdmin(createOrUpdate: boolean) {
  const configuredId = process.env.CATALOG_ADMIN_USER_ID?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (configuredId) {
    if (!createOrUpdate) return prisma.user.findUnique({ where: { id: configuredId } });
    return prisma.user.upsert({
      where: { id: configuredId },
      create: {
        id: configuredId,
        supabaseId: configuredId,
        email,
        role: UserRole.ADMIN,
        profile: { create: { displayName: 'Platform Admin' } },
      },
      update: {
        ...(email ? { email } : {}),
        role: UserRole.ADMIN,
        profile: { upsert: { create: { displayName: 'Platform Admin' }, update: { displayName: 'Platform Admin' } } },
      },
    });
  }
  if (!email) return null;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing || !createOrUpdate) return existing;
  return prisma.user.update({
    where: { id: existing.id },
    data: {
      role: UserRole.ADMIN,
      profile: { upsert: { create: { displayName: 'Platform Admin' }, update: { displayName: 'Platform Admin' } } },
    },
  });
}

async function main() {
  const options = readOptions();
  if (options.storageCheck) {
    const localFiles = await listFilesRecursively(assetDirectory);
    const recipeObjects = await listStorageObjects(recipeImageBucket, localFiles);
    const ingredientObjects = await listStorageObjects(ingredientImageBucket, localFiles);
    console.log(JSON.stringify({
      listingMethod: serviceRoleKey ? 'storage-api' : 'verified-cli-layout',
      recipeBucket: recipeImageBucket,
      recipeObjects: recipeObjects.length,
      ingredientBucket: ingredientImageBucket,
      ingredientObjects: ingredientObjects.length,
    }, null, 2));
    return;
  }
  const catalog = await loadCatalog();
  const localFiles = await listFilesRecursively(assetDirectory);
  const result = options.reconcile
    ? await reconcileAndMaybeApply(catalog, localFiles, options)
    : localSummary(catalog, localFiles);

  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('Pantry-to-Plate catalog import report');
    console.log(JSON.stringify(result, null, 2));
    if (!options.reconcile) console.log('Next: deploy the catalog migration, confirm Platform Admin, and run catalog:reconcile.');
    else if (!options.apply) console.log('No database or storage records were changed. Use --apply only after reviewing this report.');
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
