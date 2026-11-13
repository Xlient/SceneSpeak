import { z } from "zod";
import { ANIMATIONS, Animation } from "../../schemas";
import { Id } from "../../schemas/primitives";
import { SLOT_KINDS, type Catalog } from "../catalog/catalog-types";

export const MAX_RECIPE_PROPS = 12;
export const MAX_RECIPE_POSES = 20;

// Model output is untrusted: bad entries are dropped instead of failing the whole recipe.
const keepValid = <T extends z.ZodType>(item: T, max: number) =>
  z
    .array(z.unknown())
    .default([])
    .transform((items) =>
      items
        .flatMap((value): z.output<T>[] => {
          const parsed = item.safeParse(value);
          return parsed.success ? [parsed.data] : [];
        })
        .slice(0, max),
    );

export const SlotKind = z.enum(SLOT_KINDS);

export const RecipeProp = z.object({ item: Id, slot: SlotKind });
export type RecipeProp = z.infer<typeof RecipeProp>;

export const RecipePose = z.object({ lineId: Id, animation: Animation });
export type RecipePose = z.infer<typeof RecipePose>;

/** What the lesson generator (Y5) writes: catalog IDs only, no free-form geometry. */
export const SceneRecipe = z.object({
  room: Id,
  character: Id,
  props: keepValid(RecipeProp, MAX_RECIPE_PROPS),
  poses: keepValid(RecipePose, MAX_RECIPE_POSES),
});
export type SceneRecipe = z.infer<typeof SceneRecipe>;

const idEnum = (ids: readonly string[]) => {
  const [first, ...rest] = ids;
  if (first === undefined) throw new Error("Catalog section is empty");
  return z.enum([first, ...rest]);
};

/** Strict JSON Schema with the catalog's IDs as enums, for the cloud model's structured output. */
export const sceneRecipeJsonSchema = (catalog: Catalog) =>
  z.toJSONSchema(
    z.object({
      room: idEnum(catalog.rooms.map((r) => r.id)),
      character: idEnum(catalog.characters.map((c) => c.id)),
      props: z
        .array(z.object({ item: idEnum(catalog.props.map((p) => p.id)), slot: SlotKind }))
        .max(MAX_RECIPE_PROPS),
      poses: z.array(z.object({ lineId: z.string(), animation: z.enum(ANIMATIONS) })).max(MAX_RECIPE_POSES),
    }),
  );
