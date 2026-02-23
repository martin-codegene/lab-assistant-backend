import { IProtocolFactory } from "@domain/repositories";
import { ProtocolEntity, ProtocolCategory, ProtocolStep, ProtocolMaterial, ProtocolConditions } from "@domain/protocol";

export class ProtocolFactory implements IProtocolFactory {
  createPCRProtocol(data: {
    name: string;
    description?: string;
    templateDNA: string;
    primers: Array<{ name: string; sequence: string; concentration: string }>;
    polymerase: string;
    buffer: string;
    dNTPs: string;
    cycles: number;
    annealingTemp: string;
    extensionTime: string;
  }): ProtocolEntity {
    const materials: ProtocolMaterial[] = [
      { name: "Template DNA", quantity: data.templateDNA, unit: "ng", catalogNumber: "N/A" },
      { name: "Polymerase", quantity: "1", unit: "U/μL", catalogNumber: data.polymerase },
      { name: "PCR Buffer", quantity: "1", unit: "X", catalogNumber: data.buffer },
      { name: "dNTP Mix", quantity: "0.2", unit: "mM each", catalogNumber: data.dNTPs },
      { name: "Nuclease-free water", quantity: "variable", unit: "μL", catalogNumber: "N/A" },
      ...data.primers.map(primer => ({
        name: `Primer: ${primer.name}`,
        quantity: primer.concentration,
        unit: "μM",
        catalogNumber: "Custom",
      })),
    ];

    const steps: ProtocolStep[] = [
      { step: 1, action: "Prepare master mix on ice", duration: "10 min", materials: ["Polymerase", "PCR Buffer", "dNTP Mix", "Primers"] },
      { step: 2, action: "Add template DNA to master mix", duration: "5 min" },
      { step: 3, action: "Mix gently and centrifuge briefly", duration: "1 min" },
      { step: 4, action: "Initial denaturation", duration: "2 min", notes: "95°C" },
      { step: 5, action: `Denaturation (${data.cycles} cycles)`, duration: "30 sec", notes: "95°C" },
      { step: 6, action: `Annealing (${data.cycles} cycles)`, duration: "30 sec", notes: `${data.annealingTemp}°C` },
      { step: 7, action: `Extension (${data.cycles} cycles)`, duration: data.extensionTime, notes: "72°C" },
      { step: 8, action: "Final extension", duration: "5 min", notes: "72°C" },
      { step: 9, action: "Hold at 4°C", duration: "∞" },
    ];

    const conditions: ProtocolConditions = {
      temperature: "See steps",
      time: "Variable based on cycles",
      cycles: data.cycles.toString(),
    };

    return ProtocolEntity.create({
      name: data.name,
      description: data.description || "Standard PCR protocol",
      category: ProtocolCategory.PCR,
      materials,
      steps,
      conditions,
      safetyNotes: "Wear appropriate PPE. Handle reagents carefully. Dispose of waste properly.",
      references: "Standard molecular biology protocols",
      createdById: "", // Will be set by the use case
      isTemplate: true,
      isPublic: true,
    });
  }

  createWesternBlotProtocol(data: {
    name: string;
    description?: string;
    gelPercentage: string;
    transferMethod: "wet" | "semi-dry";
    primaryAntibody: string;
    secondaryAntibody: string;
    detectionMethod: "chemiluminescence" | "fluorescence";
  }): ProtocolEntity {
    const materials: ProtocolMaterial[] = [
      { name: "Acrylamide/Bis solution", quantity: data.gelPercentage, unit: "%", catalogNumber: "N/A" },
      { name: "SDS", quantity: "0.1", unit: "%", catalogNumber: "N/A" },
      { name: "TEMED", quantity: "0.1", unit: "%", catalogNumber: "N/A" },
      { name: "APS", quantity: "0.1", unit: "%", catalogNumber: "N/A" },
      { name: "Primary antibody", quantity: "1", unit: "μg/mL", catalogNumber: data.primaryAntibody },
      { name: "Secondary antibody", quantity: "1", unit: "μg/mL", catalogNumber: data.secondaryAntibody },
      { name: "Blocking buffer", quantity: "5", unit: "%", catalogNumber: "N/A" },
      { name: "Transfer buffer", quantity: "1", unit: "X", catalogNumber: "N/A" },
      { name: "Detection substrate", quantity: "1", unit: "X", catalogNumber: "Based on detection method" },
    ];

    const steps: ProtocolStep[] = [
      { step: 1, action: "Prepare separating gel", duration: "30 min" },
      { step: 2, action: "Prepare stacking gel", duration: "15 min" },
      { step: 3, action: "Load samples and run gel", duration: "1-2 hours", notes: "100-150V" },
      { step: 4, action: "Transfer proteins to membrane", duration: data.transferMethod === "wet" ? "1 hour" : "30 min", notes: `${data.transferMethod} transfer` },
      { step: 5, action: "Block membrane", duration: "1 hour", notes: "5% blocking buffer" },
      { step: 6, action: "Incubate with primary antibody", duration: "1 hour to overnight", notes: "4°C recommended for overnight" },
      { step: 7, action: "Wash membrane", duration: "3 × 5 min" },
      { step: 8, action: "Incubate with secondary antibody", duration: "1 hour" },
      { step: 9, action: "Wash membrane", duration: "3 × 5 min" },
      { step: 10, action: "Detect signal", duration: "5 min", notes: data.detectionMethod },
    ];

    const conditions: ProtocolConditions = {
      temperature: "Room temperature unless specified",
      other: {
        transferMethod: data.transferMethod,
        detectionMethod: data.detectionMethod,
      },
    };

    return ProtocolEntity.create({
      name: data.name,
      description: data.description || "Standard Western Blot protocol",
      category: ProtocolCategory.WESTERN_BLOT,
      materials,
      steps,
      conditions,
      safetyNotes: "Wear gloves and lab coat. Acrylamide is neurotoxic. Handle with care.",
      references: "Standard protein analysis protocols",
      createdById: "", // Will be set by the use case
      isTemplate: true,
      isPublic: true,
    });
  }

  createCellCultureProtocol(data: {
    name: string;
    description?: string;
    cellType: string;
    media: string;
    supplements: string[];
    splitRatio: string;
    incubationConditions: {
      temperature: string;
      co2: string;
      humidity: string;
    };
  }): ProtocolEntity {
    const materials: ProtocolMaterial[] = [
      { name: "Cell culture media", quantity: "10", unit: "mL", catalogNumber: data.media },
      { name: "Fetal Bovine Serum", quantity: "10", unit: "%", catalogNumber: "FBS" },
      { name: "Penicillin-Streptomycin", quantity: "1", unit: "%", catalogNumber: "Pen-Strep" },
      { name: "Trypsin-EDTA", quantity: "1", unit: "X", catalogNumber: "N/A" },
      { name: "PBS", quantity: "10", unit: "mL", catalogNumber: "N/A" },
      ...data.supplements.map(supplement => ({
        name: supplement,
        quantity: "As needed",
        unit: "variable",
        catalogNumber: "N/A",
      })),
    ];

    const steps: ProtocolStep[] = [
      { step: 1, action: "Pre-warm media and reagents", duration: "15 min", notes: "37°C water bath" },
      { step: 2, action: "Aspirate old media from flask", duration: "2 min" },
      { step: 3, action: "Wash cells with PBS", duration: "2 min" },
      { step: 4, action: "Add trypsin-EDTA", duration: "2-5 min", notes: "Monitor under microscope" },
      { step: 5, action: "Neutralize trypsin with complete media", duration: "2 min" },
      { step: 6, action: "Centrifuge cell suspension", duration: "5 min", notes: "300g" },
      { step: 7, action: "Resuspend cells in fresh media", duration: "2 min" },
      { step: 8, action: "Count cells and seed at appropriate density", duration: "10 min" },
      { step: 9, action: "Return to incubator", duration: "N/A", notes: `${data.incubationConditions.temperature}°C, ${data.incubationConditions.co2}% CO₂` },
    ];

    const conditions: ProtocolConditions = {
      temperature: data.incubationConditions.temperature,
      other: {
        co2: data.incubationConditions.co2,
        humidity: data.incubationConditions.humidity,
      },
    };

    return ProtocolEntity.create({
      name: data.name,
      description: data.description || `Standard ${data.cellType} cell culture protocol`,
      category: ProtocolCategory.CELL_CULTURE,
      materials,
      steps,
      conditions,
      safetyNotes: "Perform all work in biosafety cabinet. Follow sterile technique. Dispose of biohazard waste properly.",
      references: "Standard cell culture protocols",
      createdById: "", // Will be set by the use case
      isTemplate: true,
      isPublic: true,
    });
  }
}