// app/lib/i18n/locales/fr.ts
import type { Dictionary } from "../types";

export const fr = {
    meta: {
        title: "0w | Boîte à outils web axée sur la confidentialité",
        desc: "Utilitaires rapides, sécurisés et exécutés côté client pour les développeurs et la vie privée, sans traçage.",
    },
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
        buyMeACoffee: "Buy me a coffee",
    },
    privacyNotice: {
        badge: "Architecture Privacy-First",
        title: "Zero-Knowledge & Données Privées",
        subtitle:
            "0w est conçu avec une exigence absolue de confidentialité et d’exécution locale.",
        points: [
            {
                icon: "icon-[lucide--cpu]",
                title: "Traitement 100 % Local",
                desc: "L’inspection de JWT, la conversion JSON et la génération de mots de passe s’exécutent dans la mémoire de votre navigateur.",
            },
            {
                icon: "icon-[lucide--flame]",
                title: "Rétention Éphémère",
                desc: "Les secrets chiffrés et webhooks de test sont soumis à une autodestruction stricte et purgés automatiquement.",
            },
            {
                icon: "icon-[lucide--shield-off]",
                title: "Zéro Traçage Commercial",
                desc: "Aucun bandeau publicitaire, aucun cookie invasif de profilage et aucune revente de données.",
            },
        ],
        supportTitle: "Projet Libre & Indépendant",
        supportDesc:
            "0w est un projet bénévole, sans publicité ni monétisation de données. Si ces outils vous sont utiles, vous pouvez soutenir l’hébergement ou contribuer au code.",
        button: "J’ai compris & continuer",
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
        jwtInspector: {
            title: "Inspecteur & Décodeur JWT",
            desc: "Décodez, inspectez les claims et vérifiez les signatures de JWT localement dans votre navigateur.",
        },
    },
} satisfies Dictionary;
