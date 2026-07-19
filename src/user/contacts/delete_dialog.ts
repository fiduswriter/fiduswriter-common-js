import {Dialog} from "fwtoolkit"

export class DeleteContactDialog {
    contacts: Array<Record<string, unknown>>
    app: any

    constructor(contacts: Array<Record<string, unknown>>, app?: any) {
        this.contacts = contacts
        this.app = app
    }

    init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const buttons = [
                {
                    text: gettext("Delete"),
                    classes: "fw-dark",
                    click: () => {
                        this.app.apiConnectors.contacts.delete({
                            contacts: this.contacts
                        }).then(({status}: any) => {
                            dialog.close()
                            if (status == 200) {
                                return resolve()
                            }
                            return reject()
                        })
                    }
                },
                {type: "cancel"}
            ]
            const dialog = new Dialog({
                title: gettext("Confirm deletion"),
                id: "confirmdeletion",
                body: `<p>${gettext("Remove from contacts")}?</p>`,
                height: 60,
                buttons
            } as any)
            dialog.open()
        })
    }
}
