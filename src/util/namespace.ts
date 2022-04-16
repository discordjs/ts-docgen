import { DocMeta, parseMeta, type DeclarationReflection } from '../documentation';
import { parseTypedef, TypedefDoc } from './typedef';

export interface NamespaceDoc {
	name: string;
	description?: string | undefined;
	extendedDescription?: string | undefined;
	see?: string[] | undefined;
	deprecated?: boolean | undefined;
	typeAliases?: TypedefDoc[] | undefined;
	interfaces?: TypedefDoc[] | undefined;
	enumerations?: TypedefDoc[] | undefined;
	meta?: DocMeta | undefined;
}

export function parseNamespace(element: DeclarationReflection): NamespaceDoc {
	const typeAliases = element.children?.filter((c) => c.kindString === 'Type alias');
	const interfaces = element.children?.filter((c) => c.kindString === 'Interface');
	const enumerations = element.children?.filter((c) => c.kindString === 'Enumeration');

	return {
		name: element.name,
		description: element.comment?.shortText?.trim(),
		extendedDescription: element.comment?.text?.trim(),
		see: element.comment?.tags?.filter((t) => t.tag === 'see').map((t) => t.text.trim()),
		deprecated: element.comment?.tags?.some((t) => t.tag === 'deprecated'),
		typeAliases: typeAliases && typeAliases.length > 0 ? typeAliases.map(parseTypedef) : undefined,
		interfaces: interfaces && interfaces.length > 0 ? interfaces.map(parseTypedef) : undefined,
		enumerations: enumerations && enumerations.length > 0 ? enumerations.map(parseTypedef) : undefined,
		meta: parseMeta(element),
	};
}
