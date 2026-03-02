<template>
  <v-container>
    <v-row no-gutters align="center">
      <v-col cols="auto">
        <v-btn icon size="small" @click="choixUnite" title="Choisir une unité organisationnelle">
          <v-icon size="small">mdi-sitemap</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="auto" class="ml-2">
        unité organisationnelle:
      </v-col>
      <v-col cols="auto" class="ml-2">
        <strong>{{ critereUniteLibelle }}</strong>
      </v-col>
      <v-col cols="auto" class="ml-2">
        <v-btn icon size="small" @click="supprimeCritereUnite" title="Supprimer le critère d'unité organisationnelle">
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="8" md="3">
        <v-text-field clearable @click:clear="prepareRechercheEmployes" v-model="txtCritere" ref="inpTxtCritere"
          autofocus label="nom / login / id" @input="onInputCritere"></v-text-field>
      </v-col>
      <v-col cols="8" md="2">
        <v-checkbox v-model="bEmployeDesactive" label="y.c. employés désactivés" @click="onInputCritere">
        </v-checkbox>
      </v-col>
    </v-row>
    <v-row v-if="modeChoix == 'multiple' && employesListeChoisi.length > 0" no-gutters>
      <v-col cols="8" md="8">
        <v-list max-height="400">
          <v-list-subheader>
            Employés choisis ({{ employesListeChoisi.length }})
            &nbsp;&nbsp;&nbsp;&nbsp;
            <v-btn rounded="lg" @click="choixTermine()">Choix terminé</v-btn>
          </v-list-subheader>
          <v-list-item v-for="employe in employesListeChoisi" :key="employe.idemploye" :value="employe.idemploye"
            :class="`bactif${employe.bactif}`">
            <template v-slot:title>
              <span class="listeempnom mx-2">{{ employe.nom }} {{ employe.prenom }}</span>
              <span class="listeemplogin mx-2">{{ employe.login }}</span>
              <span class="listeempuo mx-2">{{ employe.unitetree }}</span>
            </template>
            <template v-slot:append>
              <v-btn color="grey-lighten-1" icon="mdi-delete" variant="text"
                @click="supprimeChoix(employe.idemploye)"></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="12" md="12">
        <v-list max-height="400">
          <v-list-subheader>{{ libelleListe }}</v-list-subheader>
          <v-list-item v-for="employe in employesListe" :key="employe.idemploye" :value="employe.idemploye"
            :class="`bactif${employe.bactif}`" @click="choixEmploye(employe)">
            <template v-slot:title>
              <span class="listeempnom mx-2">{{ employe.nom }} {{ employe.prenom }}</span>
              <span class="listeemplogin mx-2">{{ employe.login }}</span>
              <span class="listeempuo mx-2">{{ employe.unitetree }}</span>
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="dialogChoixUO" max-width="1280">
    <v-card>
      <v-card-text>
        <Suspense>
          <UniteOrgChoix :ssServer="ssServer" :ssPage="ssPageUO" @choixUniteOrg="receptionUniteOrg"></UniteOrgChoix>
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
import type { VTextField } from 'vuetify/components'
import type { Employe, ApiResponseEL } from '../axioscalls.ts'

import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { detectStringType } from '../employeChoix'
import UniteOrgChoix from './UniteOrgChoix.vue'
import { getEmployesListe } from '../axioscalls.ts'

interface Props {
  modeChoix?: string
  nombreMaximumRetour?: number
  ssServer?: string
  ssPage?: string
  ssPageUO?: string
}

interface Critere {
  iduniteorg: number,
  typecritere: string,
  critere: string,
  bemployedesactive: 0 | 1
  nombremaximumretour: number
}

interface UniteOrganisationnelle {
  id: number
  nom: string
  description: string
}


const props = withDefaults(defineProps<Props>(), {
  modeChoix: 'unique',
  nombreMaximumRetour: 100,
  ssServer: '',
  ssPage: '/goeland/employe/axios/employe_liste2.php',
  $$PageUO: '/goeland/uniteorg/axios/uniteorg_liste.php'
})

const emit = defineEmits<{
  (e: 'choixEmploye', choix: string): void
}>()

const critereUniteId = ref<number>(0)
const critereUniteLibelle = ref<string>('- toutes -')
const txtCritere = ref<string>('')
const bEmployeDesactive = ref<boolean>(false)
const inpTxtCritere = ref<VTextField | null>(null)
const dialogChoixUO = ref<boolean>(false)
const employesListe = ref<Employe[]>([])
const libelleListe = ref<string>('choix employés (0)')
const employesListeChoisi = ref<Employe[]>([])

let typingTimer: ReturnType<typeof setTimeout> | null = null
const typingInterval: number = 700
const onInputCritere = (value: string | null | undefined): void => {
  // Nettoyer le timer précédent s'il existe
  if (typingTimer) {
    clearTimeout(typingTimer)
  }

  // Créer un nouveau timer
  typingTimer = setTimeout(() => {
    prepareRechercheEmployes()
  }, typingInterval)

  // Focus sur l'input avec vérification de sécurité
  const inputElement = inpTxtCritere.value?.$el?.querySelector('input') as HTMLInputElement | null
  inputElement?.focus()
}

const prepareRechercheEmployes = (): void => {
  libelleListe.value = 'choix employés (0)'
  employesListe.value = []
  let typeCritere: string = 'nom'
  if (txtCritere.value === null) {
    txtCritere.value = ''
  }
  const tCritere = txtCritere.value.trim() //variable pour éviter le trim sur txtCritere.value
  if (txtCritere.value !== '') {
    typeCritere = detectStringType(tCritere)
  }
  if (critereUniteId.value > 1 || tCritere !== '') {
    rechercheEmployes(critereUniteId.value, typeCritere, tCritere, bEmployeDesactive.value, props.nombreMaximumRetour)
  }
}

const rechercheEmployes = async (idUO: number, typeCritere: string, critere: string, bEmployeDesactive: boolean, nbrRetour: number): Promise<void> => {
  let ibEmployeDesactive: 0 | 1 = 0
  if (bEmployeDesactive) {
    ibEmployeDesactive = 1
  }

  const oCritere: Critere = {
    "iduniteorg": idUO,
    "typecritere": typeCritere,
    "critere": critere,
    "bemployedesactive": ibEmployeDesactive,
    "nombremaximumretour": nbrRetour
  }
  const response: ApiResponseEL = await getEmployesListe(props.ssServer, props.ssPage, JSON.stringify(oCritere))
  employesListe.value = response.success && response.data ? response.data : []
  if (employesListe.value.length < nbrRetour) {
    libelleListe.value = `Choix employes (${employesListe.value.length})`
  } else {
    libelleListe.value = `Choix employe (${employesListe.value.length}). Attention, plus de ${nbrRetour} employés correspondent aux critères`
  }
}

const choixEmploye = (employe: Employe): void => {
  if (props.modeChoix == 'unique') {
    emit('choixEmploye', JSON.stringify(employe))
  } else if (props.modeChoix == 'multiple') {
    if (employesListeChoisi.value.some(objet => objet.idemploye === employe.idemploye) === false) {
      employesListeChoisi.value.push(employe)
    }
  }
}

const supprimeChoix = (idemploye: number) => {
  employesListeChoisi.value = employesListeChoisi.value.filter(objet => objet.idemploye !== idemploye)
}

const choixTermine = (): void => {
  emit('choixEmploye', JSON.stringify(employesListeChoisi.value))
  employesListeChoisi.value = []
}


const choixUnite = (): void => {
  dialogChoixUO.value = true
}

const receptionUniteOrg = (jsonData: string) => {
  dialogChoixUO.value = false
  const uoChoisie: UniteOrganisationnelle = JSON.parse(jsonData)
  critereUniteId.value = uoChoisie.id
  critereUniteLibelle.value = uoChoisie.description
  prepareRechercheEmployes()
}

const supprimeCritereUnite = (): void => {
  critereUniteId.value = 0
  critereUniteLibelle.value = '- toutes -'
  prepareRechercheEmployes()
}

const closeChoixUO = (): void => {
  dialogChoixUO.value = false
  critereUniteId.value = 0
}

</script>

<style scoped>
.listeempnom {
  font-weight: bold;
}

.listeemplogin {
  font-size: small
}

.listeempuo {
  font-size: small;
  font-style: italic;
}

.bactif0 {
  font-style: italic;
  color: rgb(252, 182, 182)
}

.bactif1 {
  font-style: normal;
}
</style>