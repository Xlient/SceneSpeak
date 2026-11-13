import { z } from "zod";

export const INTENTS = [
  "greet",
  "introduce_self",
  "ask_name",
  "say_name",
  "ask_origin",
  "say_origin",
  "ask_wellbeing",
  "say_wellbeing",
  "thank",
  "say_goodbye",
  "order_item",
  "ask_price",
  "ask_bill",
  "ask_location",
  "ask_directions",
  "check_in",
  "ask_for_help",
] as const;

export const Intent = z.enum(INTENTS);
export type Intent = z.infer<typeof Intent>;

export const isIntent = (value: unknown): value is Intent => Intent.safeParse(value).success;
