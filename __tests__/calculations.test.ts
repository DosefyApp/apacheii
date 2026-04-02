import { describe, expect, it } from "vitest";
import { apacheIiEngine } from "@/features/clinical-calculators/engines/engine";

describe("apacheIiEngine", () => {
  it("retorna zero em paciente estável", () => {
    const parsed = apacheIiEngine.parse({
      temperature: 37,
      meanArterialPressure: 85,
      heartRate: 88,
      respiratoryRate: 18,
      oxygenationMode: "pao2",
      oxygenationValue: 85,
      arterialPh: 7.4,
      sodium: 140,
      potassium: 4,
      creatinine: 1,
      acuteRenalFailure: false,
      hematocrit: 40,
      whiteBloodCells: 9,
      glasgowComaScale: 15,
      age: 40,
      chronicHealth: false,
      chronicHealthContext: "none",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const result = apacheIiEngine.compute(parsed.data);
    expect(result.headline.value).toBe("0");
    expect(result.headline.status).toBe("Risco baixo");
  });

  it("gera escore intermediário", () => {
    const parsed = apacheIiEngine.parse({
      temperature: 37,
      meanArterialPressure: 85,
      heartRate: 120,
      respiratoryRate: 30,
      oxygenationMode: "pao2",
      oxygenationValue: 65,
      arterialPh: 7.35,
      sodium: 140,
      potassium: 4,
      creatinine: 1.6,
      acuteRenalFailure: false,
      hematocrit: 40,
      whiteBloodCells: 16,
      glasgowComaScale: 14,
      age: 55,
      chronicHealth: false,
      chronicHealthContext: "none",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const result = apacheIiEngine.compute(parsed.data);
    expect(result.headline.value).toBe("11");
    expect(result.headline.status).toBe("Risco moderado");
  });

  it("reconhece paciente crítico", () => {
    const parsed = apacheIiEngine.parse({
      temperature: 34,
      meanArterialPressure: 45,
      heartRate: 170,
      respiratoryRate: 40,
      oxygenationMode: "aa_gradient",
      oxygenationValue: 520,
      arterialPh: 7.1,
      sodium: 160,
      potassium: 6.5,
      creatinine: 4.2,
      acuteRenalFailure: true,
      hematocrit: 22,
      whiteBloodCells: 22,
      glasgowComaScale: 8,
      age: 78,
      chronicHealth: true,
      chronicHealthContext: "emergency_postop_or_medical",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const result = apacheIiEngine.compute(parsed.data);
    expect(Number(result.headline.value)).toBeGreaterThan(25);
    expect(result.headline.status).toBe("Risco muito alto");
  });
});
