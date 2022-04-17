/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { readFile, writeFile } from 'node:fs/promises';
import { join, extname, basename, dirname, relative, normalize } from 'node:path';
import { load } from 'js-yaml';
import type { JSONOutput } from 'typedoc';

import { FORMAT_VERSION, generateDocs, generateFinalOutput } from './documentation';

export type ProjectData = JSONOutput.ProjectReflection;

// I'm using an interface only because otherwise it messes up my syntax highlighter
export interface customSettings
	extends Record<
		string,
		{
			name: string;
			files: Record<
				string,
				{
					name: string;
					type: string;
					content: string;
					path: string;
				} | null
			>;
		}
	> {}

interface Config {
	/** Source directories to parse TypeDoc in */
	source?: string[];

	/** Path ot an existing TypeDoc JSON output file */
	existingOutput?: string;

	/** Custom docs definition file to use */
	custom?: string;

	/** Root directory of the project */
	root?: string;

	/** Path to output file */
	output?: string;

	/** Number of spaces to use in output JSON */
	spaces?: number;

	/** Path to your tsconfig file */
	tsconfig?: string;

	/** Logs extra information to the console */
	verbose?: boolean;

	/** Path to JSON/YAML config file with the options above*/
	config?: string;
}

function parseConfig(config: Config) {
	if (config.source) config.source = config.source.map(normalize);
	if (config.existingOutput) config.existingOutput = normalize(config.existingOutput);
	if (config.custom) config.custom = normalize(config.custom);
	config.root = normalize(config.root ?? '.');
	if (config.output) config.output = normalize(config.output);
	if (!config.spaces) config.spaces = 0;
	if (!config.verbose) config.verbose = false;

	return config;
}

export function runGenerator(config: Config) {
	config = parseConfig(config);

	const mainPromises = [];

	if (config.existingOutput) {
		console.log('Parsing using existing output file...');
		mainPromises[0] = readFile(config.existingOutput, 'utf-8').then(JSON.parse);
	}

	if (config.custom) {
		console.log('Loading custom docs files...');
		const customDir = dirname(config.custom);

		// Figure out what type of definitions file we're loading
		let type: string;
		const defExtension = extname(config.custom).toLowerCase();
		if (defExtension === '.json') type = 'json';
		else if (defExtension === '.yml' || defExtension === '.yaml') type = 'yaml';
		else throw new TypeError('Unknown custom docs definition file type.');

		mainPromises[1] = readFile(config.custom, 'utf-8').then((defContent) => {
			// Parse the definition file
			let definitions;
			if (type === 'json') definitions = JSON.parse(defContent);
			else definitions = load(defContent);

			const custom: customSettings = {};
			const filePromises = [];

			for (const cat of definitions) {
				// Add the category to the custom docs
				const catID = cat.id || cat.name.toLowerCase();
				const dir = join(customDir, cat.path || catID);
				const category: typeof custom['category'] = {
					name: cat.name || cat.id,
					files: {},
				};
				custom[catID] = category;

				// Add every file in the category
				for (const file of cat.files) {
					const fileRootPath = join(dir, file.path);
					const extension = extname(file.path);
					const fileID = file.id || basename(file.path, extension);
					category.files[fileID] = null;

					filePromises.push(
						readFile(fileRootPath, 'utf-8').then((content) => {
							category.files[fileID] = {
								name: file.name,
								type: extension.toLowerCase().replace(/^\./, ''),
								content,
								path: relative(config.root ?? '.', fileRootPath).replace(/\\/g, '/'),
							};
							if (config.verbose) console.log(`Loaded custom docs file ${catID as string}/${fileID as string}`);
						}),
					);
				}
			}

			return Promise.all(filePromises).then(() => {
				const fileCount = Object.keys(custom)
					.map((k) => Object.keys(custom[k]))
					.reduce((prev, c) => prev + c.length, 0);
				const categoryCount = Object.keys(custom).length;
				console.log(
					`${fileCount} custom docs file${fileCount === 1 ? '' : 's'} in ` +
						`${categoryCount} categor${categoryCount === 1 ? 'y' : 'ies'} loaded.`,
				);
				return custom;
			});
		});
	}

	Promise.all(mainPromises)
		.then(async (results) => {
			const [data, custom] = results as [ProjectData, customSettings];

			console.log(`Serializing documentation with format version ${FORMAT_VERSION}...`);
			const docs = generateDocs(data);
			const output = JSON.stringify(generateFinalOutput(docs, custom), null, config.spaces);

			if (config.output) {
				console.log(`Writing to ${config.output}...`);
				await writeFile(config.output, output);
			}

			console.log('Done!');
			process.exit(0);
		})
		.catch((err) => {
			console.error(err);
			process.exit(1);
		});
}
