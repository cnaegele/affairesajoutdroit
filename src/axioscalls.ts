import axios from 'axios'
import type { AxiosResponse, AxiosError } from 'axios'
export interface TypeAffaire {
    idtypeaffaire: number
    typeaffaire: string
    bactif: number
}
export interface TypeDroit {
    id: number
    libelle: string
}
export interface TypeAffaireData {
    idtypeaffaire: number
    typeaffaire: string
    bactif: number
    nbraffairesencours: number
    nbraffairesensuspens: number
    nbraffairestermine: number
}
export interface ApiResponseTAL {
    success?: boolean
    message?: string
    data?: TypeAffaire[]
}
export interface ApiResponseTD {
    success?: boolean
    message?: string
    data?: TypeDroit[]
}
export interface ApiResponseTAD {
    success?: boolean
    message?: string
    data?: TypeAffaireData[]
}

export interface UniteOrganisationnelle {
    iduniteorg: number;
    iduoparente: number | null;
    nomuniteorg: string;
    descriptionuniteorg: string;
    bcache: number;
    codeordre: string;
}
export interface ApiResponseUOL {
    success?: boolean;
    message?: string;
    data?: UniteOrganisationnelle[];
}
export interface Employe {
  idemploye: number
  nom: string
  prenom: string
  bactif: number
  login?: string
  unite?: string
  directionabr?: string
  serviceabr?: string
  unitetree?: string
}
export interface ApiResponseEL {
  success: boolean
  message: string
  data?: Employe[]
}
// Interface générique pour les réponses API
export interface ApiResponse<T> {
    success: boolean
    message: string
    data?: T[]
}

export async function getTypesAffaireListe(server: string = '', page: string): Promise<ApiResponseTAL> {
    const urltal: string = `${server}${page}`
    try {
        const response: AxiosResponse<TypeAffaire[]> = await axios.get(urltal)
        const respData: ApiResponseTAL = {
            "success": true,
            "message": `ok`,
            "data": response.data
        }
        //console.log(respData)
        return respData
    } catch (error) {
        return traiteAxiosError(error as AxiosError)
    }
}

export async function getDicoAffaireDroitEmpUO(server: string = '', page: string): Promise<ApiResponseTD> {
    const urltal: string = `${server}${page}`
    try {
        const response: AxiosResponse<TypeDroit[]> = await axios.get(urltal)
        const respData: ApiResponseTD = {
            "success": true,
            "message": `ok`,
            "data": response.data
        }
        //console.log(respData)
        return respData
    } catch (error) {
        return traiteAxiosError(error as AxiosError)
    }
}
export async function getTypeAffaireData(server: string = '', page: string, idtypeaffaire: number): Promise<ApiResponseTAD> {
    const urltaol: string = `${server}${page}`
    const params = new URLSearchParams([['idtypeaffaire', idtypeaffaire.toString()]])
    try {
        const response: AxiosResponse<TypeAffaireData[]> = await axios.get(urltaol, { params })
        const respData: ApiResponseTAD = {
            "success": true,
            "message": `ok`,
            "data": response.data
        }
        console.log(respData)
        return respData
    } catch (error) {
        return traiteAxiosError(error as AxiosError)
    }
}

export async function getEmployesListe(server: string = '', page: string, jsonCriteres: string = '{}'): Promise<ApiResponseEL> {
  if (import.meta.env.DEV) {console.log(jsonCriteres)}
  const url: string = `${server}${page}`
  const params = new URLSearchParams([['jsoncriteres', jsonCriteres]])
  try {
    const response: AxiosResponse<Employe[]> = await axios.get(url, { params })
    const respData: ApiResponseEL = {
      "success": true,
      "message": `ok`,
      "data": response.data
    }
    if (import.meta.env.DEV) {console.log(respData)}
    return respData
  } catch (error) {
    return traiteAxiosError(error as AxiosError)
  }
}

export async function getUnitesOrgListe(server: string = '', page: string, jsonCriteres: string = '{}'): Promise<ApiResponseUOL> {
    console.log(jsonCriteres)
    const urluol: string = `${server}${page}`
    const params = new URLSearchParams([['jsoncriteres', jsonCriteres]])
    try {
        const response: AxiosResponse<UniteOrganisationnelle[]> = await axios.get(urluol, { params })
        const respData: ApiResponseUOL = {
            "success": true,
            "message": `ok`,
            "data": response.data
        }
        console.log(respData)
        return respData
    } catch (error) {
        return traiteAxiosError(error as AxiosError)
    }
}

export async function sauveAffairesAjoutDroit(server: string = '', page: string, jsonData: string = '{}'): Promise<ApiResponse<string>> {
    const url: string = `${server}${page}`
    console.log(`sauveAffairesAjoutDroit: url: ${url} data: ${jsonData}`)
    /*
    const respData: ApiResponse<string> = {
      "success": true,
      "message": `ok`,
      "data": ['salut']
    }
    return respData
    */

    try {
        const response: AxiosResponse = await axios.post(url, jsonData, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        console.log(response.data)
        return response.data
    } catch (error) {
        return traiteAxiosError(error as AxiosError)
    }

}

function traiteAxiosError<T>(error: AxiosError): ApiResponse<T> {
    let msgErr: string = ''
    if (error.response) {
        msgErr = `${error.response.data}<br>${error.response.status}<br>${error.response.headers}`
    } else if (error.request.responseText) {
        msgErr = error.request.responseText
    } else {
        msgErr = error.message
    }
    const respData: ApiResponse<T> = {
        "success": false,
        "message": `ERREUR. ${msgErr}`,
    }
    return (respData)
}