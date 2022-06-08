import path from 'path';
import type { JSONOutput } from 'typedoc';
import type { customSettings, ProjectData } from './index';
import { ClassDoc, parseClass } from './util/class';
import { FunctionDoc, parseFunction } from './util/function';
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
	functions: FunctionDoc[];
}

type RootElement =
	| {
			type: 'class';
			value: ClassDoc;
	  }
	| {
			type: 'typedef';
			value: TypedefDoc;
	  }
	| {
			type: 'function';
			value: FunctionDoc;
	  };

function parseRootElement(element: DeclarationReflection): RootElement | undefined {
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

		case 'Function': {
			return {
				type: 'function',
				value: parseFunction(element),
			};
		}

		// Externals?

		default:
	}
}

export function generateDocs(data: ProjectData): CodeDoc {
	const classes: ClassDoc[] = [];
	// interfaces = [], // not using this at the moment
	// externals = [], // ???
	const typedefs: TypedefDoc[] = [];
	const functions: FunctionDoc[] = [];

	for (const c of data.children ?? []) {
		const root = parseRootElement(c);
		if (!root) continue;

		if (root.type === 'class') classes.push(root.value);
		// if (root.type == 'interface') interfaces.push(root.value)
		if (root.type === 'typedef') typedefs.push(root.value);
		// if (root.type == 'external') externals.push(root.value)
		if (root.type === 'function') functions.push(root.value);
	}

	return {
		classes,
		// interfaces,
		// externals,
		typedefs,
		functions,
	};
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
}
