'use client';

import { useState } from 'react';

type TargetOutput = 'typescript' | 'pydantic' | 'formatted' | 'minified';

const DEFAULT_SAMPLE_JSON = JSON.stringify(
  {
    id: 1042,
    username: 'alex_dev',
    is_active: true,
    score: 98.5,
    tags: ['admin', 'moderator'],
    profile: {
      bio: 'Fullstack developer',
      website: 'https://0w.lat',
      social_links: [
        { platform: 'github', url: 'https://github.com' }
      ]
    },
    metadata: null
  },
  null,
  2
);

// --- Helpers de typage & conventions de nommage ---

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^([a-z])/, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '') || 'Item';
}

function isValidIdentifier(key: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
}

// --- Générateur TypeScript ---

function generateTypeScript(rootName: string, jsonVal: any): string {
  const definitions: string[] = [];

  function inferType(val: any, currentKey: string): string {
    if (val === null) return 'any';
    if (typeof val === 'string') return 'string';
    if (typeof val === 'number') return 'number';
    if (typeof val === 'boolean') return 'boolean';

    if (Array.isArray(val)) {
      if (val.length === 0) return 'any[]';
      const itemTypes = Array.from(new Set(val.map(item => inferType(item, currentKey))));
      const unifiedType = itemTypes.length === 1 ? itemTypes[0] : `(${itemTypes.join(' | ')})`;
      return `${unifiedType}[]`;
    }

    if (typeof val === 'object') {
      const typeName = toPascalCase(currentKey);
      const props: string[] = [];

      for (const [key, value] of Object.entries(val)) {
        const propName = isValidIdentifier(key) ? key : JSON.stringify(key);
        const isNullable = value === null;
        const inferred = inferType(value, key);
        props.push(`  ${propName}: ${inferred}${isNullable ? ' | null' : ''};`);
      }

      definitions.push(`export interface ${typeName} {\n${props.join('\n')}\n}`);
      return typeName;
    }

    return 'any';
  }

  const rootTypeName = toPascalCase(rootName);
  const resultType = inferType(jsonVal, rootTypeName);

  if (Array.isArray(jsonVal)) {
    return `${definitions.join('\n\n')}\n\nexport type ${rootTypeName} = ${resultType};`.trim();
  }

  return definitions.join('\n\n').trim();
}

// --- Générateur Python (Pydantic v2) ---

function generatePydantic(rootName: string, jsonVal: any): string {
  const definitions: string[] = [];
  const pythonKeywords = new Set([
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
    'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
    'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
    'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
  ]);

  function inferType(val: any, currentKey: string): string {
    if (val === null) return 'Optional[Any] = None';
    if (typeof val === 'string') return 'str';
    if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float';
    if (typeof val === 'boolean') return 'bool';

    if (Array.isArray(val)) {
      if (val.length === 0) return 'list[Any]';
      const itemTypes = Array.from(new Set(val.map(item => inferType(item, currentKey))));
      const unifiedType = itemTypes.length === 1 ? itemTypes[0] : `Union[${itemTypes.join(', ')}]`;
      return `list[${unifiedType}]`;
    }

    if (typeof val === 'object') {
      const modelName = toPascalCase(currentKey);
      const fields: string[] = [];

      for (const [key, value] of Object.entries(val)) {
        let fieldName = key;
        const needsAlias = !isValidIdentifier(key) || pythonKeywords.has(key);
        if (needsAlias) {
          fieldName = `field_${key.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        }

        const isNullable = value === null;
        const typeStr = inferType(value, key);

        let typeAnnotation = typeStr;
        if (isNullable) {
          typeAnnotation = `Optional[Any] = None`;
        }

        if (needsAlias) {
          fields.push(`    ${fieldName}: ${typeAnnotation} = Field(alias="${key}")`);
        } else {
          fields.push(`    ${fieldName}: ${typeAnnotation}`);
        }
      }

      definitions.push(`class ${modelName}(BaseModel):\n${fields.length > 0 ? fields.join('\n') : '    pass'}`);
      return modelName;
    }

    return 'Any';
  }

  const rootModelName = toPascalCase(rootName);
  inferType(jsonVal, rootModelName);

  const header = `from __future__ import annotations\nfrom typing import Any, Optional, Union\nfrom pydantic import BaseModel, Field\n\n`;
  return `${header}${definitions.join('\n\n')}`.trim();
}

// --- Composant Principal ---

export default function JsonConverterComponent() {
  const [inputJson, setInputJson] = useState<string>(DEFAULT_SAMPLE_JSON);
  const [rootName, setRootName] = useState<string>('Root');
  const [activeTab, setActiveTab] = useState<TargetOutput>('typescript');
  const [copied, setCopied] = useState(false);

  // Évaluation synchrone à chaque frappe
  let parsedJson: any = null;
  let jsonError: string | null = null;
  let outputResult = '';

  try {
    if (inputJson.trim().length > 0) {
      parsedJson = JSON.parse(inputJson);
    }
  } catch (err: any) {
    jsonError = err?.message || 'JSON non valide';
  }

  if (jsonError) {
    outputResult = `Erreur de syntaxe JSON :\n${jsonError}`;
  } else if (!parsedJson) {
    outputResult = '// Saisissez un JSON valide pour voir la structure';
  } else {
    switch (activeTab) {
      case 'typescript':
        outputResult = generateTypeScript(rootName, parsedJson);
        break;
      case 'pydantic':
        outputResult = generatePydantic(rootName, parsedJson);
        break;
      case 'formatted':
        outputResult = JSON.stringify(parsedJson, null, 2);
        break;
      case 'minified':
        outputResult = JSON.stringify(parsedJson);
        break;
    }
  }

  const handleCopy = async () => {
    if (!outputResult || jsonError) return;
    try {
      await navigator.clipboard.writeText(outputResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormatInput = () => {
    if (parsedJson) {
      setInputJson(JSON.stringify(parsedJson, null, 2));
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl border border-base-300 w-full max-w-6xl mx-auto">
      <div className="card-body gap-4 p-4 sm:p-6">

        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-base-300">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="icon-[lucide--code-xml] text-primary size-6"></span>
              Convertisseur & Formateur JSON
            </h2>
            <p className="text-xs text-base-content/70">
              Générez instantanément vos interfaces TypeScript ou modèles Pydantic v2.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold whitespace-nowrap">Nom Racine :</label>
            <input
              type="text"
              value={rootName}
              onChange={(e) => setRootName(e.target.value || 'Root')}
              className="input input-sm input-bordered font-mono w-full sm:w-36"
              placeholder="Root"
            />
          </div>
        </div>

        {/* Panneau Principal Split-View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Colonne Gauche: Entrée JSON */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center h-8">
              <span className="text-xs font-bold uppercase tracking-wide text-base-content/80">
                JSON Source
              </span>
              <button
                onClick={handleFormatInput}
                disabled={Boolean(jsonError)}
                className="btn btn-xs btn-ghost gap-1"
                title="Formater le JSON en entrée"
              >
                <span className="icon-[lucide--align-left] size-3.5"></span>
                Formater
              </button>
            </div>

            <div className="relative">
              <textarea
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                placeholder="Collez votre JSON ici..."
                className={`textarea textarea-bordered font-mono text-xs w-full h-[450px] leading-relaxed resize-none ${
                  jsonError ? 'border-error focus:border-error' : ''
                }`}
                spellCheck={false}
              />
              {jsonError && (
                <div className="absolute bottom-3 left-3 right-3 bg-error/90 text-error-content text-xs p-2 rounded flex items-center gap-2">
                  <span className="icon-[lucide--alert-circle] size-4 shrink-0"></span>
                  <span className="truncate">{jsonError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Colonne Droite: Sortie Typée */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center h-8">
              {/* Onglets de sélection du format */}
              <div className="join">
                <button
                  onClick={() => setActiveTab('typescript')}
                  className={`join-item btn btn-xs ${activeTab === 'typescript' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  TypeScript
                </button>
                <button
                  onClick={() => setActiveTab('pydantic')}
                  className={`join-item btn btn-xs ${activeTab === 'pydantic' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Pydantic v2
                </button>
                <button
                  onClick={() => setActiveTab('formatted')}
                  className={`join-item btn btn-xs ${activeTab === 'formatted' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Beautify
                </button>
                <button
                  onClick={() => setActiveTab('minified')}
                  className={`join-item btn btn-xs ${activeTab === 'minified' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Minify
                </button>
              </div>

              {/* Bouton de Copie */}
              <button
                onClick={handleCopy}
                disabled={Boolean(jsonError)}
                className={`btn btn-xs gap-1.5 ${copied ? 'btn-success' : 'btn-secondary'}`}
              >
                <span className={copied ? 'icon-[lucide--check] size-3.5' : 'icon-[lucide--copy] size-3.5'}></span>
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>

            {/* Zone de code généré */}
            <div className="relative">
              <textarea
                readOnly
                value={outputResult}
                className="textarea textarea-bordered font-mono text-xs w-full h-[450px] leading-relaxed resize-none bg-base-300/40 select-all"
                spellCheck={false}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
