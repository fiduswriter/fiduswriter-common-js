import {OdtImporter as GenericOdtImporter} from "@fiduswriter/document/importer/odt"
import {createNativeImporterBackend} from "../native/import.js"

export class OdtImporter extends GenericOdtImporter {
    constructor(
        file: File,
        user: Record<string, unknown>,
        path: string,
        importId: string,
        options: Record<string, unknown> = {}
    ) {
        const apiConnectors = (options as any).apiConnectors
        super(file, user as any, path, importId, {
            getTemplate: (id: string) =>
                apiConnectors.documentImport.getTemplate(id).then((result: any) => result.template),
            nativeBackend: createNativeImporterBackend(
                user,
                options.e2eeOptions as any,
                apiConnectors
            ),
            bibDB: options.bibDB,
            e2eeOptions: options.e2eeOptions
        } as any)
    }
}
