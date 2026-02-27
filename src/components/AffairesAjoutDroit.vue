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
            <div v-if="message != ''" id="divMessage">{{ message }}</div>
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
                        <v-col cols="auto">
                            <v-btn color="primary" @click="choisirEmploye">Choix d'un employé</v-btn>
                        </v-col>
                        <v-col cols="auto">
                            <v-btn color="primary" @click="dialogChoixUO = true">Choix d'une unité</v-btn>
                        </v-col>
                    </v-row>
                </v-container>
            </div>
        </v-main>
    </v-app>

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
import { ref } from 'vue'
import packageJson from '../../package.json'
//import CallerInfo from './CallerInfo.vue';
//import CallerIsInGroup from './CallerIsInGroup.vue';
//import TypesAffaireListeChoix from './TypesAffaireListeChoix.vue';
//import UniteOrgChoix from './UniteOrgChoix.vue';
import { getTypeAffaireData } from '@/axioscalls.ts'

interface UOChoisie {
  id: number
  nom: string
  description?: string
}

const version = ref<string>(packageJson.version)
const messageErreur = ref<string | undefined>('')
const message = ref<string>('')
let erreurSauve: boolean = false

//Data caller et droits caller
const callerInformation = ref<UserInfo | null | undefined>(null)
const bGoelandManager = ref<boolean>(false)

const idTypeAffaireChoisi = ref<number | null>(null)
const dialogChoixUO = ref<boolean>(false)
const modeChoixUO = ref<string>('unique')
const ssServer = ref<string>('')
if (import.meta.env.DEV) {
    ssServer.value = 'https://mygolux.lausanne.ch'
}
const ssPage: string = '/goeland/gestion_spec/affaires_ajoutdroit/axios/typeaffaire_data.php'
const ssPageSauve: string = '/goeland/gestion_spec/affaires_ajoutdroit/axios/affaires_ajoutdroit.php'

const typeAffaire = ref<string>('')
const nbrAffairesEnCours = ref<number>(0)
const inclureEnCours = ref<boolean>(true)
const nbrAffairesEnSuspens = ref<number>(0)
const inclureEnSuspens = ref<boolean>(true)
const nbrAffairesTermine = ref<number>(0)
const inclureTermine = ref<boolean>(false)

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

const receptionUniteOrg = (jsonData: string) => {
  dialogChoixUO.value = false
  if (modeChoixUO.value == 'unique') { jsonData = `[${jsonData}]` }
  const uoChoisie: UOChoisie[] = JSON.parse(jsonData)
  console.log(jsonData)
  uoChoisie.forEach(async (item: UOChoisie) => {
    if (idTypeAffaireChoisi.value !== null) {
    /*
      const oData: DataSauve = {
        action: 'sauve',
        idtypeaffaire: idTypeAffaireChoisi.value,
        iduniteorg: item.id
      }
      const response: ApiResponse<[]> = await sauveTypeAffaireOrgunitCreation(ssServer.value, ssPageSauve, JSON.stringify(oData))
      if (response.success === false) {
        messageErreur.value += `${response.message}\n`
        erreurSauve = true
      } else {
        erreurSauve = false
      }
      //listeUniteOrgCre(idTypeAffaireChoisi.value)
      */
    }      
  })
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