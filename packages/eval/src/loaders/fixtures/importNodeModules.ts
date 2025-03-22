import { modularScale } from "polished";
import * as v from "valibot";

export const fontSize = modularScale(2);
export const Schema = v.object({
  name: v.string(),
  age: v.pipe(v.number(), v.integer(), v.minValue(1)),
});
