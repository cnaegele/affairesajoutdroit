<template>
    <CallerInfo :ssServer="ssServer" @callerinfo="receptionCallerInfo"></CallerInfo>
    <CallerIsInGroup :ssServer="ssServer" nomgroupe="GoelandManager"
        @calleringroup="receptionCallerInGroupGoelandManager"></CallerIsInGroup>

    <v-app>
        <v-main>
            <v-app-bar color="primary" prominent density="compact" app>
                <v-toolbar-title>Ajout droit sur toutes les affaires d'un type donné&nbsp;<small>(version {{ version
                }})</small></v-toolbar-title>
                <v-spacer></v-spacer>
                <div style="position: absolute; right: 16px;">
                    Utilisateur: {{ callerInformation?.prenom }} {{ callerInformation?.nom }} ({{
                        callerInformation?.login }}) - {{ callerInformation?.unite }}
                </div>
            </v-app-bar>
            <div v-if="messageErreur != ''" id="divErreur">{{ messageErreur }}</div>
            <div v-if="bGoelandManager">
                <suspense>
                    <TypesAffaireListeChoix @choixTypeAffaire="receptionTypeAffaire"></TypesAffaireListeChoix>
                </suspense>
            </div>
            <div v-if="idTypeAffaireChoisi !== null">
                <v-container fluid class="pl-6">
                    <v-row>
                        <v-col>
                            <h3>Ajout de droit aux affaires du type {{ typeAffaire }}</h3>
                        </v-col>
                    </v-row>

                    <v-row align="center">
                        <v-col cols="3">
                            <span>Nombre d'affaires en cours : {{ nbrAffairesEnCours }}</span>
                        </v-col>
                        <v-col cols="auto" class="d-flex align-center ga-2">
                            <v-switch v-model="inclureEnCours" color="primary" label="ajout" hide-details inset>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row align="center">
                        <v-col cols="3">
                            <span>Nombre d'affaires en suspens : {{ nbrAffairesEnSuspens }}</span>
                        </v-col>
                        <v-col cols="auto" class="d-flex align-center ga-2">
                            <v-switch v-model="inclureEnSuspens" color="primary" label="ajout" hide-details inset>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row align="center">
                        <v-col cols="3">
                            <span>Nombre d'affaires terminées : {{ nbrAffairesTermine }}</span>
                        </v-col>
                        <v-col cols="auto" class="d-flex align-center ga-2">
                            <v-switch v-model="inclureTermine" color="primary" label="ajout" hide-details inset>
                            </v-switch>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="auto" style="min-width: 250px;">
                            <v-select v-model="idTypeDroit" :items="listeTypesDroit" item-title="libelle"
                                item-value="id" label="Type de droit" />
                        </v-col>
                    </v-row>
                    <v-row v-if="idEmployeChoisi > 0">
                        <v-col cols="auto" class="d-flex align-center ga-2">Employe : {{ libelleEmploye }}</v-col>
                    </v-row>
                    <v-row v-if="idUniteChoisi > 0">
                        <v-col cols="auto" class="d-flex align-center ga-2">Unité : {{ libelleUnite }}</v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="auto"
                            v-if="idTypeAffaireChoisi !== null && idTypeDroit > 0 && (idUniteChoisi > 0 || idEmployeChoisi > 0) && (inclureEnCours || inclureEnSuspens || inclureTermine)">
                            <v-btn color="red" @click="sauver">Sauver</v-btn>
                        </v-col>
                        <v-col cols="auto"
                            v-if="idTypeAffaireChoisi !== null && idTypeDroit > 0 && (idUniteChoisi > 0 || idEmployeChoisi > 0)">
                            <v-btn color="primary" @click="reinitialiser">Réinitialiser sans sauver</v-btn>
                        </v-col>
                        <v-col cols="auto">
                            <v-btn color="primary" @click="dialogChoixEmp = true">Choix d'un employé</v-btn>
                        </v-col>
                        <v-col cols="auto">
                            <v-btn color="primary" @click="dialogChoixUO = true">Choix d'une unité</v-btn>
                        </v-col>
                    </v-row>
                </v-container>
            </div>
            <div v-if="messageInfo != ''" id="divMessage">{{ messageInfo }}</div>
        </v-main>
    </v-app>

    <v-dialog v-model="dialogChoixEmp" max-width="1280">
        <v-card>
            <v-card-text>
                <EmployeChoix :ssServer="ssServer" @choixEmploye="receptionEmploye" :modeChoix="modeChoixEmp">
                </EmployeChoix>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="Fermer" @click="closeChoixEmp()"></v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="dialogChoixUO" max-width="1280">
        <v-card>
            <v-card-text>
                <Suspense>
                    <UniteOrgChoix :ssServer="ssServer" :modeChoix="modeChoixUO" @choixUniteOrg="receptionUniteOrg">
                    </UniteOrgChoix>
                </Suspense>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="Fermer" @click="closeChoixUO()"></v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import type { ApiResponseUI, UserInfo } from './CallerInfo.vue'
import type { ApiResponseIG } from './CallerIsInGroup.vue'
import type { TypeAffaireData, ApiResponseTAD, ApiResponse } from '@/axioscalls.ts'
import type { TypeDroit, ApiResponseTD } from '@/axioscalls.ts'
import { onMounted, ref } from 'vue'
import packageJson from '../../package.json'
import { getDicoAffaireDroitEmpUO, getTypeAffaireData, sauveAffairesAjoutDroit } from '@/axioscalls.ts'

interface UOChoisie {
    id: number
    nom: string
    description?: string
}
interface DataSauve {
    idtypeaffaire: number
    idtypedroit: number
    uniteouemploye: 'E' | 'O'
    iduniteouemploye: number
    baffaireencours: number
    baffaireensuspens: number
    baffairetermine: number
}

const version = ref<string>(packageJson.version)
const messageErreur = ref<string | undefined>('')
const messageInfo = ref<string>('')
let erreurSauve: boolean = false

//Data caller et droits caller
const callerInformation = ref<UserInfo | null | undefined>(null)
const bGoelandManager = ref<boolean>(false)

const idTypeAffaireChoisi = ref<number | null>(null)
const dialogChoixEmp = ref<boolean>(false)
const dialogChoixUO = ref<boolean>(false)
const modeChoixUO = ref<string>('unique')
const modeChoixEmp = ref<string>('unique')
const ssServer = ref<string>('')
if (import.meta.env.DEV) {
    ssServer.value = 'https://mygolux.lausanne.ch'
}
const ssPage: string = '/goeland/gestion_spec/affaires_ajoutdroit/axios/typeaffaire_data.php'
const ssPageDicoDroit: string = '/goeland/gestion_spec/affaire_datainitgestion/axios/affaire_dicodroiteo.php'
const ssPageSauve: string = '/goeland/gestion_spec/affaires_ajoutdroit/axios/affaires_ajoutdroit_sauve.php'

const typeAffaire = ref<string>('')
const nbrAffairesEnCours = ref<number>(0)
const inclureEnCours = ref<boolean>(true)
const nbrAffairesEnSuspens = ref<number>(0)
const inclureEnSuspens = ref<boolean>(true)
const nbrAffairesTermine = ref<number>(0)
const inclureTermine = ref<boolean>(false)
const listeTypesDroit = ref<TypeDroit[]>([])
const idTypeDroit = ref<number>(0)
const idEmployeChoisi = ref<number>(0)
const idUniteChoisi = ref<number>(0)
const libelleEmploye = ref<string>('')
const libelleUnite = ref<string>('')

onMounted(async () => {
    const response: ApiResponseTD = await getDicoAffaireDroitEmpUO(ssServer.value, ssPageDicoDroit)
    if (response.data !== undefined) {
        const typesDroit: TypeDroit[] = response.data
        listeTypesDroit.value = [
            { id: 0, libelle: '- Choisir le type de droit -' },
            ...typesDroit,
        ]
    } else {
        messageErreur.value += `${response.message}\n`
    }
})

const dataTypeAffaire = async (idTypeAffaire: number): Promise<void> => {
    const response: ApiResponseTAD = await getTypeAffaireData(ssServer.value, ssPage, idTypeAffaire)
    if (response.success === false) {
        messageErreur.value += `${response.message}\n`
    } else {
        if (erreurSauve === false) {
            messageErreur.value = ''
            console.log('response', response.data)
        }
    }
    typeAffaire.value = response.data?.[0]?.typeaffaire as string
    nbrAffairesEnCours.value = response.data?.[0]?.nbraffairesencours as number
    nbrAffairesEnSuspens.value = response.data?.[0]?.nbraffairesensuspens as number
    nbrAffairesTermine.value = response.data?.[0]?.nbraffairestermine as number
}

const reinitialiser = (): void => {
    idEmployeChoisi.value = 0
    idUniteChoisi.value = 0
    idTypeDroit.value = 0
}

const sauver = async (): Promise<void> => {
    if (idTypeAffaireChoisi.value !== null && (idEmployeChoisi.value > 0 || idUniteChoisi.value > 0) && idTypeDroit.value > 0 && (inclureEnCours.value || inclureEnSuspens.value || inclureTermine.value)) {
        const typeDroit = listeTypesDroit.value.find(d => d.id === idTypeDroit.value)?.libelle
        let statutAffaires: string = ''
        if (inclureEnCours.value) {
            statutAffaires += 'en cours'
        }
        if (inclureEnSuspens.value) {
            if (statutAffaires !== '') { statutAffaires += ', ' }
            statutAffaires += 'en suspens'
        }
        if (inclureTermine.value) {
            if (statutAffaires !== '') { statutAffaires += ', ' }
            statutAffaires += 'terminées'
        }
        messageInfo.value = `Ajout pour toutes les affaires ${statutAffaires} du type ${typeAffaire.value} du droit ${typeDroit} pour ${libelleEmploye.value}${libelleUnite.value}`
        let uniteOuEmploye: 'E' | 'O'
        let idUniteOuEmploye: number
        let bAffaireEnCours: number, bAffaireEnSuspens: number, bAffaireTermine: number
        if (idEmployeChoisi.value > 0) {
            uniteOuEmploye = 'E'
            idUniteOuEmploye = idEmployeChoisi.value
        } else {
            uniteOuEmploye = 'O'
            idUniteOuEmploye = idUniteChoisi.value
        }
        if (inclureEnCours.value) {
            bAffaireEnCours = 1
        } else {
            bAffaireEnCours = 0
        }
        if (inclureEnSuspens.value) {
            bAffaireEnSuspens = 1
        } else {
            bAffaireEnSuspens = 0
        }
        if (inclureTermine.value) {
            bAffaireTermine = 1
        } else {
            bAffaireTermine = 0
        }
        const oData: DataSauve = {
            idtypeaffaire: idTypeAffaireChoisi.value,
            idtypedroit: idTypeDroit.value,
            uniteouemploye: uniteOuEmploye,
            iduniteouemploye: idUniteOuEmploye,
            baffaireencours: bAffaireEnCours,
            baffaireensuspens: bAffaireEnSuspens,
            baffairetermine: bAffaireTermine
        }

        const response: ApiResponse<string> = await sauveAffairesAjoutDroit(ssServer.value, ssPageSauve, JSON.stringify(oData))
        if (response.success === false) {
            messageErreur.value += `${response.message}\n`
            erreurSauve = true
        } else {
            messageInfo.value += `\n${response.message}`
            erreurSauve = false
        }

        reinitialiser()
    }
}

const closeChoixEmp = (): void => {
    dialogChoixEmp.value = false
}

const closeChoixUO = (): void => {
    dialogChoixUO.value = false
}

const receptionTypeAffaire = (idTypeAffaire: number, jsonData: string) => {
    idTypeAffaireChoisi.value = idTypeAffaire
    if (idTypeAffaire > 0) {
        console.log(jsonData)
        dataTypeAffaire(idTypeAffaire)
    } else {
        idTypeAffaireChoisi.value = null
    }
}

const receptionEmploye = (jsonData: string) => {
    dialogChoixEmp.value = false
    console.log(`Réception employé json: ${jsonData}`)
    const oEmploye = JSON.parse(jsonData)
    let aEmployes = []
    if (Array.isArray(oEmploye)) {
        aEmployes = oEmploye
    } else {
        aEmployes.push(oEmploye)
    }
    //Pour le moment choix unique exclusivement
    idUniteChoisi.value = 0
    libelleUnite.value = ''
    idEmployeChoisi.value = aEmployes[0].idemploye
    libelleEmploye.value = `${aEmployes[0].nom} ${aEmployes[0].prenom} (${aEmployes[0].login}). ${aEmployes[0].unitetree}`
}

const receptionUniteOrg = (jsonData: string) => {
    dialogChoixUO.value = false
    if (modeChoixUO.value == 'unique') { jsonData = `[${jsonData}]` }
    const uoChoisie: UOChoisie[] = JSON.parse(jsonData)
    //Pour le moment choix unique exclusivement
    if (uoChoisie[0] !== undefined) {
        idUniteChoisi.value = uoChoisie[0].id
        libelleUnite.value = uoChoisie[0].description ?? ''
        idEmployeChoisi.value = 0
        libelleEmploye.value = ''
    }
}

const receptionCallerInfo = (jsonData: string) => {
    const retCallerInformation = ref<ApiResponseUI>(JSON.parse(jsonData))
    if (retCallerInformation.value.success) {
        callerInformation.value = retCallerInformation.value.data
    }
}

const receptionCallerInGroupGoelandManager = (jsonData: string) => {
    const retCallerInGroup = ref<ApiResponseIG>(JSON.parse(jsonData))
    if (retCallerInGroup.value.success && retCallerInGroup.value.data !== undefined) {
        bGoelandManager.value = retCallerInGroup.value.data.isingroup
    }
    if (!bGoelandManager.value) {
        messageErreur.value = "Page réservée aux managers goéland"
    }
}
</script>

<style scoped>
#divErreur {
    background-color: lightsalmon;
    margin-left: 5px;
    margin-right: 5px;
    margin-top: 0px;
    padding: 5px;
    border-style: solid;
    border-width: thin;
    border-color: black;
    border-radius: 20px;
    white-space: pre-line;
    /* Convertit les \n en sauts de ligne */
}

#divMessage {
    margin-left: 5px;
    margin-right: 5px;
    margin-top: 0px;
    padding: 5px;
    border-style: solid;
    border-width: thin;
    border-color: black;
    border-radius: 20px;
    white-space: pre-line;
    /* Convertit les \n en sauts de ligne */
}
</style>