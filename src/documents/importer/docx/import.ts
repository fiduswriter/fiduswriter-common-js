import {DocxImporter as GenericDocxImporter} from "@fiduswriter/document/importer/docx"
import {createNativeImporterBackend} from "../native/import.js"

export class DocxImporter extends GenericDocxImporter {
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
            e2eeOptions: options.e2eeOptions
        } as any)
    }
}
