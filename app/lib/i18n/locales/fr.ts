// app/lib/i18n/locales/fr.ts
import type { Dictionary } from "../types";

export const fr = {
    meta: {
        title: "0w | Boîte à outils web axée sur la confidentialité",
        desc: "Utilitaires rapides, sécurisés et exécutés côté client pour les développeurs et la vie privée, sans traçage.",
    },
    common: {
        home: "Accueil",
        offlineTitle: "Serveur backend hors ligne",
        offlineDesc:
            "Les outils nécessitant l’API sont momentanément désactivés.",
        copy: "Copier",
        copied: "Copié !",
        login: "Connexion",
        tools: "Outils",
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
        passwordGenerator: {
          title: "Générateur de Mots de Passe & Secrets",
          desc: "Générez des mots de passe robustes, des phrases Diceware mémorisables et des secrets cryptographiques.",
          tabPassword: "Mot de passe",
          tabPassphrase: "Phrase (Diceware)",
          tabSecret: "Secret Développeur",

          // Password Mode
          length: "Longueur : {length}",
          uppercase: "Majuscules (A-Z)",
          lowercase: "Minuscules (a-z)",
          numbers: "Chiffres (0-9)",
          symbols: "Symboles (!@#$...)",
          avoidAmbiguous: "Exclure les caractères ambigus (0, O, 1, l, I)",

          // Passphrase Mode
          wordsCount: "Nombre de mots : {count}",
          separator: "Séparateur",
          separatorHyphen: "Tiret (-)",
          separatorDot: "Point (.)",
          separatorUnderscore: "Underscore (_)",
          separatorSpace: "Espace ( )",
          capitalize: "Majuscule à chaque mot",
          includeNumber: "Ajouter un chiffre aléatoire",

          // Secret Mode
          secretType: "Format du secret",
          bytesCount: "Taille d'entropie : {bytes} octets ({bits} bits)",
          formatHex: "Hex (ex: openssl rand -hex)",
          formatBase64: "Base64",
          formatBase64Url: "Base64URL (clé JWT)",
          formatUuid: "UUID v4",

          // Output & Entropy
          regenerate: "Régénérer",
          copy: "Copier",
          copied: "Copié !",
          entropyBits: "{bits} bits d'entropie",
          strengthWeak: "Faible",
          strengthFair: "Moyen",
          strengthStrong: "Robuste",
          strengthCryptographic: "Niveau Cryptographique",
          estimatedCrackTime: "Estimation craquage GPU offline : {time}",
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
        exifCleaner: {
          title: "Inspecteur & Nettoyeur EXIF",
          desc: "Inspectez et supprimez les coordonnées GPS, l'appareil photo et les métadonnées privées de vos photos.",
          dropzone: "Glissez une image ici ou cliquez pour parcourir",
          dropzoneHint: "Prend en charge JPEG, PNG, WebP — Analysé et nettoyé 100 % hors ligne dans votre navigateur",
          inspecting: "Analyse des métadonnées...",
          cleaning: "Nettoyage en cours...",
          auditTitle: "Audit de sécurité",
          metadataFoundTitle: "Métadonnées détectées ({count} balises)",
          noMetadataTitle: "Aucune métadonnée détectée",
          noMetadataDesc: "Cette photo ne contient aucune balise EXIF, GPS ou appareil. Elle peut être partagée en toute sécurité !",
          gpsAlertTitle: "Localisation GPS précise détectée",
          gpsAlertDesc: "Cette photo contient les coordonnées exactes du lieu de la prise de vue.",
          viewOnMap: "Voir sur OpenStreetMap",
          device: "Appareil / Marque",
          capturedAt: "Date de capture",
          software: "Logiciel",
          lens: "Objectif",
          exposure: "Exposition",
          rawTags: "Toutes les balises brutes ({count})",
          stripAndDownload: "Nettoyer & Télécharger",
          cleanSuccessBadge: "Assainie",
          cleanedSuccessTitle: "Métadonnées supprimées avec succès",
          originalSize: "Poids initial",
          cleanedSize: "Poids assaini",
          cleanedFileNameSuffix: "_sans_exif",
          newImage: "Inspecter une autre image",
        },
    },
} satisfies Dictionary;
