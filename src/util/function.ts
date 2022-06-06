import { ClassMethodParamDoc, parseParam } from './class';
import { DocType, parseType } from './types';
import { DeclarationReflection, DocMeta, parseMeta } from '../documentation';

export interface FunctionDoc {
	name: string;
	description?: string | undefined;
	see?: string[] | undefined;
	access?: 'private' | undefined;
	nullable?: never | undefined; // it would already be in the type
	deprecated?: boolean | undefined;
	type?: DocType | undefined;
	props?: never | undefined; // prefer using a type reference (like a dedicated instance) instead of documenting using @property tags
	meta?: DocMeta | undefined;
	params?: ClassMethodParamDoc[] | undefined;
	returns?: DocType | undefined;
	returnsDescription?: string | undefined;
}

export function parseFunction(element: DeclarationReflection): FunctionDoc {
	const signature = (element.signatures ?? [])[0] || element;

	return {
		name: element.name,
		description: element.comment?.shortText?.trim(),
		see: element.comment?.tags?.filter((t) => t.tag === 'see').map((t) => t.text.trim()),
		access:
			element.flags.isPrivate || element.comment?.tags?.some((t) => t.tag === 'private' || t.tag === 'internal')
				? 'private'
				: undefined,
		deprecated: element.comment?.tags?.some((t) => t.tag === 'deprecated'),
		// @ts-expect-error
		type: element.type ? parseType(element.type) : undefined,
		meta: parseMeta(element),
		params: signature.parameters ? signature.parameters.map(parseParam) : undefined,
		returns: signature.type ? parseType(signature.type) : undefined,
		returnsDescription: element.comment?.text?.split('\n')[0].trim(),
	};
}
