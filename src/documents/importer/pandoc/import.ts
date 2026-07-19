import {BibliographyImporter} from "@fiduswriter/bibliography-manager/import"
import {PandocImporter as GenericPandocImporter} from "@fiduswriter/document/importer/pandoc"
import {createNativeImporterBackend} from "../native/import.js"

export class PandocImporter extends GenericPandocImporter {
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
            importBibliography: (bibString: string) =>
                new Promise(resolve => {
                    if (!bibString) {
                        resolve({})
                        return
                    }
                    const tempBibDB = {
                        saveBibEntries: (data: any) =>
                            Promise.resolve(
                                Object.entries(data).map((entry, index) => [
                                    entry[0],
                                    index + 1
                                ])
                            )
                    }
                    const importer = new BibliographyImporter(
                        bibString,
                        tempBibDB as any,
                        () => {},
                        () => {},
                        false
                    )
                    const originalOnMessage = importer.onMessage
                    importer.onMessage = function (this: any, message: any) {
                        if (message.type === "data") {
                            resolve(message.data)
                        }
                        originalOnMessage.call(this, message)
                    }
                    importer.init()
                }),
            nativeBackend: createNativeImporterBackend(
                user,
                options.e2eeOptions as any,
                apiConnectors
            ),
            e2eeOptions: options.e2eeOptions
        } as any)
    }
}
