// app/lib/i18n/locales/fr.ts
import type { Dictionary } from "../types";

export const fr = {
    common: {
        offlineTitle: "Serveur backend hors ligne",
        offlineDesc:
            "Les outils nécessitant l’API sont momentanément désactivés.",
        copy: "Copier",
        copied: "Copié !",
        login: "Connexion",
        allCategories: "Tout",
        searchPlaceholder: "Chercher un outil...",
        noResults: "Aucun résultat trouvé",
        clearSearch: "Réinitialiser",
        help: "Aide",
        contribute: "Contribution",
        buyMeACoffee: "Buy me a coffee"
    },
    categories: {
        security: {
            title: "Sécurité & Confidentialité",
            desc: "Chiffrement côté client, génération d’identifiants et partage zero-knowledge.",
        },
        developer: {
            title: "Outils Développeur",
            desc: "Formateurs, convertisseurs de types et inspection de webhooks en direct.",
        },
        network: {
            title: "Web & Réseau",
            desc: "Raccourcisseurs d’URL, cartes de connexion Wi-Fi et utilitaires web.",
        },
    },
    tools: {
        urlShortener: {
            title: "Raccourcisseur d’URL",
            desc: "Raccourcisseur de liens rapide avec 0w.lat.",
        },
        passwdGenerator: {
            title: "Générateur de Mots de Passe",
            desc: "Générez des mots de passe aléatoires et phrases sécurisées localement.",
        },
        jsonConverter: {
            title: "Convertisseur & Formateur JSON",
            desc: "Générez instantanément des interfaces TypeScript ou modèles Pydantic v2.",
        },
        qrCode: {
            title: "QR Code & Fiche Wi-Fi",
            desc: "Générez des QR codes pour liens et créez une fiche de connexion Wi-Fi.",
        },
        secretShare: {
            title: "Partage de Secret Chiffré",
            desc: "Chiffrement AES-GCM 256 bits côté client avec autodestruction à la lecture.",
        },
        webhookCatcher: {
            title: "Capteur de Webhooks",
            desc: "Testez et inspectez des requêtes HTTP et webhooks en direct via WebSockets.",
        },
    },
} satisfies Dictionary;
