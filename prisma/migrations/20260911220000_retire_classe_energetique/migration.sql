-- Retire définitivement le champ hérité du template électroménager :
-- aucune catégorie vendue ici (conteneurs) n'est soumise à l'étiquette
-- énergie européenne, et aucun produit n'avait de valeur renseignée
-- (vérifié avant migration : 0 ligne concernée).
ALTER TABLE "Product" DROP COLUMN "energyEfficiencyClass";
