import { z } from "zod";
import { buildEngine } from "@/features/clinical-calculators/engines/helpers";

const schema = z.object({
  temperature: z.coerce.number().min(25).max(45),
  meanArterialPressure: z.coerce.number().min(20).max(250),
  heartRate: z.coerce.number().min(20).max(250),
  respiratoryRate: z.coerce.number().min(1).max(80),
  oxygenationMode: z.enum(["aa_gradient", "pao2"]),
  oxygenationValue: z.coerce.number().min(1).max(800),
  arterialPh: z.coerce.number().min(6.8).max(7.9),
  sodium: z.coerce.number().min(90).max(220),
  potassium: z.coerce.number().min(1).max(10),
  creatinine: z.coerce.number().min(0.1).max(15),
  acuteRenalFailure: z.coerce.boolean(),
  hematocrit: z.coerce.number().min(5).max(80),
  whiteBloodCells: z.coerce.number().min(0.1).max(80),
  glasgowComaScale: z.coerce.number().int().min(3).max(15),
  age: z.coerce.number().int().min(16).max(120),
  chronicHealth: z.coerce.boolean(),
  chronicHealthContext: z.enum(["none", "elective_postop", "emergency_postop_or_medical"]),
});

function scoreTemperature(value: number) {
  if (value >= 41 || value <= 29.9) return 4;
  if ((value >= 39 && value <= 40.9) || (value >= 30 && value <= 31.9)) return 3;
  if (value >= 32 && value <= 33.9) return 2;
  if ((value >= 38.5 && value <= 38.9) || (value >= 34 && value <= 35.9)) return 1;
  return 0;
}

function scoreMap(value: number) {
  if (value >= 160 || value <= 49) return 4;
  if (value >= 130 && value <= 159) return 3;
  if ((value >= 110 && value <= 129) || (value >= 50 && value <= 69)) return 2;
  return 0;
}

function scoreHeartRate(value: number) {
  if (value >= 180 || value <= 39) return 4;
  if ((value >= 140 && value <= 179) || (value >= 40 && value <= 54)) return 3;
  if ((value >= 110 && value <= 139) || (value >= 55 && value <= 69)) return 2;
  return 0;
}

function scoreRespiratoryRate(value: number) {
  if (value >= 50 || value <= 5) return 4;
  if (value >= 35 && value <= 49) return 3;
  if (value >= 6 && value <= 9) return 2;
  if ((value >= 25 && value <= 34) || (value >= 10 && value <= 11)) return 1;
  return 0;
}

function scoreOxygenation(mode: "aa_gradient" | "pao2", value: number) {
  if (mode === "aa_gradient") {
    if (value >= 500) return 4;
    if (value >= 350) return 3;
    if (value >= 200) return 2;
    return 0;
  }

  if (value < 55) return 4;
  if (value <= 60) return 3;
  if (value <= 70) return 1;
  return 0;
}

function scorePh(value: number) {
  if (value >= 7.7 || value < 7.15) return 4;
  if ((value >= 7.6 && value <= 7.69) || (value >= 7.15 && value <= 7.24)) return 3;
  if (value >= 7.25 && value <= 7.32) return 2;
  if (value >= 7.5 && value <= 7.59) return 1;
  return 0;
}

function scoreSodium(value: number) {
  if (value >= 180 || value <= 110) return 4;
  if ((value >= 160 && value <= 179) || (value >= 111 && value <= 119)) return 3;
  if ((value >= 155 && value <= 159) || (value >= 120 && value <= 129)) return 2;
  if (value >= 150 && value <= 154) return 1;
  return 0;
}

function scorePotassium(value: number) {
  if (value >= 7 || value < 2.5) return 4;
  if (value >= 6 && value <= 6.9) return 3;
  if (value >= 2.5 && value <= 2.9) return 2;
  if ((value >= 5.5 && value <= 5.9) || (value >= 3 && value <= 3.4)) return 1;
  return 0;
}

function scoreCreatinine(value: number, acuteRenalFailure: boolean) {
  let points = 0;

  if (value >= 3.5) {
    points = 4;
  } else if (value >= 2) {
    points = 3;
  } else if (value >= 1.5 || value < 0.6) {
    points = 2;
  }

  return acuteRenalFailure ? points * 2 : points;
}

function scoreHematocrit(value: number) {
  if (value >= 60 || value < 20) return 4;
  if ((value >= 50 && value <= 59.9) || (value >= 20 && value <= 29.9)) return 2;
  if (value >= 46 && value <= 49.9) return 1;
  return 0;
}

function scoreWhiteBloodCells(value: number) {
  if (value >= 40 || value < 1) return 4;
  if ((value >= 20 && value <= 39.9) || (value >= 1 && value <= 2.9)) return 2;
  if (value >= 15 && value <= 19.9) return 1;
  return 0;
}

function scoreAge(value: number) {
  if (value >= 75) return 6;
  if (value >= 65) return 5;
  if (value >= 55) return 3;
  if (value >= 45) return 2;
  return 0;
}

function scoreChronicHealth(chronicHealth: boolean, context: "none" | "elective_postop" | "emergency_postop_or_medical") {
  if (!chronicHealth || context === "none") {
    return 0;
  }

  return context === "elective_postop" ? 2 : 5;
}

export const apacheIiEngine = buildEngine(schema, (values) => {
  const apsBreakdown = [
    ["Temperatura", scoreTemperature(values.temperature)],
    ["PAM", scoreMap(values.meanArterialPressure)],
    ["Frequência cardíaca", scoreHeartRate(values.heartRate)],
    ["Frequência respiratória", scoreRespiratoryRate(values.respiratoryRate)],
    ["Oxigenação", scoreOxygenation(values.oxygenationMode, values.oxygenationValue)],
    ["pH arterial", scorePh(values.arterialPh)],
    ["Sódio", scoreSodium(values.sodium)],
    ["Potássio", scorePotassium(values.potassium)],
    ["Creatinina", scoreCreatinine(values.creatinine, values.acuteRenalFailure)],
    ["Hematócrito", scoreHematocrit(values.hematocrit)],
    ["Leucócitos", scoreWhiteBloodCells(values.whiteBloodCells)],
    ["Glasgow", 15 - values.glasgowComaScale],
  ] as const;

  const aps = apsBreakdown.reduce((sum, [, score]) => sum + score, 0);
  const ageScore = scoreAge(values.age);
  const chronicHealthScore = scoreChronicHealth(values.chronicHealth, values.chronicHealthContext);
  const total = aps + ageScore + chronicHealthScore;

  let status = "Risco baixo";
  let tone: "success" | "info" | "warning" | "danger" = "success";

  if (total >= 5 && total <= 9) {
    status = "Risco baixo a moderado";
    tone = "info";
  } else if (total >= 10 && total <= 14) {
    status = "Risco moderado";
    tone = "warning";
  } else if (total >= 15 && total <= 19) {
    status = "Risco moderado a alto";
    tone = "warning";
  } else if (total >= 20 && total <= 24) {
    status = "Risco alto";
    tone = "danger";
  } else if (total >= 25) {
    status = "Risco muito alto";
    tone = "danger";
  }

  return {
    headline: {
      label: "APACHE II",
      value: String(total),
      status,
      tone,
      description: "APACHE II = acute physiology score + idade + saúde crônica.",
    },
    interpretation: {
      title: "Interpretação clínica",
      tone,
      description:
        "Quanto maior o score APACHE II, maior a gravidade e o risco de mortalidade hospitalar. O escore é uma ferramenta de estratificação e não prediz o desfecho individual.",
      bullets: [
        "Use o pior valor fisiológico das primeiras 24 horas de UTI.",
        values.acuteRenalFailure ? "Creatinina foi pontuada com dobra por insuficiência renal aguda." : "Creatinina foi pontuada sem dobra por insuficiência renal aguda.",
      ],
    },
    calculation: {
      title: "Como foi calculado",
      tone: "default",
      bullets: [
        `APS = ${apsBreakdown.map(([, score]) => score).join(" + ")} = ${aps}`,
        `Idade = ${ageScore}`,
        `Saúde crônica = ${chronicHealthScore}`,
        `APACHE II total = ${aps} + ${ageScore} + ${chronicHealthScore} = ${total}`,
      ],
    },
    extraPanels: [
      {
        title: "Subtotais",
        tone,
        rows: [
          { label: "APS", value: String(aps) },
          { label: "Idade", value: String(ageScore) },
          { label: "Saúde crônica", value: String(chronicHealthScore) },
        ],
      },
      {
        title: "Que variáveis mais pesaram",
        tone: aps >= 15 ? "danger" : tone,
        bullets: apsBreakdown
          .filter(([, score]) => score > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([label, score]) => `${label}: ${score} ponto(s)`),
      },
    ],
  };
});

export const calculatorEngine = apacheIiEngine;
