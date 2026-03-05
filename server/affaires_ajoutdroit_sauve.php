<?php
require 'gdt/gautentificationf5.php';
require_once '/data/dataweb/GoelandWeb/webservice/employe/clCNWSEmployeSecurite.php';
require_once 'gdt/cldbgoeland.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers:  *");
header("Access-Control-Allow-Methods:  POST");
$jsonData = file_get_contents('php://input');
$idCaller = 0;
if (array_key_exists('empid', $_SESSION)) {
    $idCaller = $_SESSION['empid'];
}
if ($idCaller > 0) {
    $pseudoWSEmployeSecurite = new CNWSEmployeSecurite();
    if ($pseudoWSEmployeSecurite->isInGroupe($idCaller, 'GoelandManager')) {
        $oData = json_decode($jsonData);
        if (isset($oData->idtypeaffaire)) {
            $idTypeAffaire = $oData->idtypeaffaire;
            $idTypeDroit = $oData->idtypedroit;
            $uniteOuEmploye = $oData->uniteouemploye;
            $iduniteOuEmploye = $oData->iduniteouemploye;
            $bAffaireEnCours = $oData->baffaireencours;
            $bAffaireEnSuspens = $oData->baffaireensuspens;
            $bAffaireTermine = $oData->baffairetermine;
            $sSql = "cn_affairedroitemporou_sauve_pourtypeaffaire $idTypeAffaire, $idTypeDroit, '$uniteOuEmploye', $iduniteOuEmploye, $bAffaireEnCours, $bAffaireEnSuspens, $bAffaireTermine";
            $dbgo = new DBGoeland();
            $dbgo->queryRetString($sSql, 'W');
            $messageSP = $dbgo->resString;
            unset($dbgo);
            echo '{"message":"' . $messageSP . '"}';
        }
    } else {
        echo '{"message":"ERREUR GoelandManager requis"}';
    }
} else {
    echo '{"message":"ERREUR athentification F5"}';
}