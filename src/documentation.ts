import path from 'path';
import type { JSONOutput } from 'typedoc';
import type { customSettings, ProjectData } from './index';
import { ClassDoc, parseClass } from './util/class';
import { NamespaceDoc, parseNamespace } from './util/namespace';
import { TypedefDoc, parseTypedef } from './util/typedef';
import { version } from '../package.json';

export const FORMAT_VERSION = 20;

export type DeclarationReflection = JSONOutput.DeclarationReflection;

export function generateFinalOutput(codeDocs: CodeDoc, customDocs: customSettings) {
	return {
		meta: {
			version,
			format: FORMAT_VERSION,
			date: Date.now(),
		},
		custom: customDocs,
		...codeDocs,
	};
}

interface CodeDoc {
	classes: ClassDoc[];
	// interfaces: unknown[]
	// external: unknown[]
	typedefs: TypedefDoc[];
	namespaces: NamespaceDoc[];
}

export function generateDocs(data: ProjectData): CodeDoc {
	const classes = [];
	// interfaces = [], // not using this at the moment
	// externals = [], // ???
	const typedefs = [];
	const namespaces = [];

	for (const c of data.children ?? []) {
		const { type, value } = parseRootElement(c);
		if (!value) continue;

		if (type === 'class') classes.push(value);
		// if (type === 'interface') interfaces.push(value);
		if (type === 'typedef') typedefs.push(value);
		if (type === 'namespace') namespaces.push(value);
		// if (type == 'external') externals.push(value)
	}

	return {
		classes,
		// interfaces,
		// externals,
		typedefs,
		namespaces,
	};
}

function parseRootElement(element: DeclarationReflection) {
	switch (element.kindString) {
		case 'Class':
			return {
				type: 'class',
				value: parseClass(element),
			};

		case 'Interface':
		case 'Type alias':
		case 'Enumeration':
			return {
				type: 'typedef',
				value: parseTypedef(element),
			};
		case 'Namespace':
			return {
				type: 'namespace',
				value: parseNamespace(element),
			};

		// Externals?

		default:
			return {};
	}
}

export interface DocMeta {
	line: number;
	file: string;
	path: string;
}

export function parseMeta(element: DeclarationReflection): DocMeta | undefined {
	const meta = element.sources?.[0];

	if (meta) {
		return {
			line: meta.line,
			file: path.basename(meta.fileName),
			path: path.dirname(meta.fileName),
		};
	}

	return undefined;
}
