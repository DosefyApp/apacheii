import { z } from "zod";
import type { CalculatorEngine, CalculatorResult } from "@/features/clinical-calculators/types";
import { normalizeFieldErrors } from "@/features/clinical-calculators/utils";

export function buildEngine<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  compute: (values: z.infer<typeof schema>) => CalculatorResult,
): CalculatorEngine {
  return {
    parse(payload) {
      const parsed = schema.safeParse(payload);

      if (!parsed.success) {
        return {
          success: false,
          fieldErrors: normalizeFieldErrors(parsed.error.flatten().fieldErrors),
        };
      }

      return {
        success: true,
        data: parsed.data,
      };
    },
    compute(values) {
      return compute(values as z.infer<typeof schema>);
    },
  };
}
