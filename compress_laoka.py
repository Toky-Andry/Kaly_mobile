
from PIL import Image
import os
import shutil

LAOKA_DIR = "assets/laoka"
BACKUP_DIR = "assets/laoka_backup"
TARGET_SIZE = (400, 400)  # pixels max
QUALITY = 72              # qualité JPEG (72 = bon compromis qualité/taille)

def compress_images():
    # Vérifier que le dossier existe
    if not os.path.exists(LAOKA_DIR):
        print(f"❌ Dossier '{LAOKA_DIR}' introuvable!")
        print("   Lancez ce script depuis la racine de votre projet.")
        return

    # Créer backup
    if not os.path.exists(BACKUP_DIR):
        shutil.copytree(LAOKA_DIR, BACKUP_DIR)
        print(f"✅ Backup créé dans '{BACKUP_DIR}'")
    else:
        print(f"ℹ️  Backup déjà existant dans '{BACKUP_DIR}'")

    # Calculer taille avant
    total_before = sum(
        os.path.getsize(os.path.join(LAOKA_DIR, f))
        for f in os.listdir(LAOKA_DIR)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    )

    print(f"\n📦 Taille avant : {total_before / 1024 / 1024:.1f} MB")
    print(f"🎯 Compression en cours...\n")

    compressed = 0
    errors = 0

    for filename in sorted(os.listdir(LAOKA_DIR)):
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue

        filepath = os.path.join(LAOKA_DIR, filename)
        size_before = os.path.getsize(filepath)

        try:
            with Image.open(filepath) as img:
                # Convertir en RGB si nécessaire
                if img.mode in ('RGBA', 'P', 'LA'):
                    img = img.convert('RGB')

                # Redimensionner si plus grand que TARGET_SIZE
                if img.width > TARGET_SIZE[0] or img.height > TARGET_SIZE[1]:
                    img.thumbnail(TARGET_SIZE, Image.LANCZOS)

                # Sauvegarder avec compression
                img.save(filepath, 'JPEG', quality=QUALITY, optimize=True)

            size_after = os.path.getsize(filepath)
            reduction = (1 - size_after / size_before) * 100
            print(f"  ✅ {filename:<45} {size_before//1024:>4}KB → {size_after//1024:>4}KB  (-{reduction:.0f}%)")
            compressed += 1

        except Exception as e:
            print(f"  ❌ {filename}: {e}")
            errors += 1

    # Calculer taille après
    total_after = sum(
        os.path.getsize(os.path.join(LAOKA_DIR, f))
        for f in os.listdir(LAOKA_DIR)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    )

    print(f"\n{'='*60}")
    print(f"✅ {compressed} images compressées | ❌ {errors} erreurs")
    print(f"📦 Taille avant  : {total_before / 1024 / 1024:.1f} MB")
    print(f"📦 Taille après  : {total_after / 1024 / 1024:.1f} MB")
    print(f"💾 Économie      : {(total_before - total_after) / 1024 / 1024:.1f} MB ({(1 - total_after/total_before)*100:.0f}%)")
    print(f"\n🎉 Terminé ! Lancez maintenant:")
    print(f"   eas build --platform android --profile preview")
    print(f"\n💡 Si problème, restaurez le backup:")
    print(f"   rmdir /s /q assets\\laoka")
    print(f"   rename assets\\laoka_backup laoka")

if __name__ == "__main__":
    compress_images()