"use client";

import CrudManager from "@/components/CrudManager";

export default function AdminClubes() {
  return (
    <CrudManager
      apiPath="/api/clubs"
      title="Clubes"
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "city", label: "Cidade", type: "text" },
        { name: "country", label: "País", type: "text" },
        { name: "founded", label: "Fundação", type: "text" },
        { name: "emblem", label: "URL do Escudo", type: "text" },
        { name: "primaryKit", label: "Uniforme Primário", type: "text" },
        { name: "secondaryKit", label: "Uniforme Secundário", type: "text" },
        { name: "attack", label: "Ataque (0-100)", type: "number", default: 50 },
        { name: "midfield", label: "Meio-Campo (0-100)", type: "number", default: 50 },
        { name: "defense", label: "Defesa (0-100)", type: "number", default: 50 },
        { name: "goalkeeper", label: "Goleiro (0-100)", type: "number", default: 50 },
        { name: "chemistry", label: "Entrosamento (0-100)", type: "number", default: 50 },
        { name: "form", label: "Forma (0-100)", type: "number", default: 50 },
        { name: "morale", label: "Moral (0-100)", type: "number", default: 50 },
      ]}
      displayFields={[
        { key: "emblem", label: "Escudo" },
        { key: "name", label: "Nome" },
        { key: "city", label: "Cidade" },
        { key: "country", label: "País" },
        { key: "founded", label: "Fundação" },
        { key: "attack", label: "ATA" },
      ]}
    />
  );
}
