# Pasos para Deployar Edge Function

## 1. Obtener Access Token

1. Ve a: https://supabase.com/dashboard/account/tokens
2. Haz clic en "Generate new token"
3. Dale un nombre: "CLI Deploy"
4. Copia el token generado

## 2. Configurar el token en PowerShell

```powershell
$env:SUPABASE_ACCESS_TOKEN = "tu-token-aqui"
```

## 3. Link al proyecto

```powershell
cd C:\Users\Usuario\Documents\Programs\fuelier
supabase link --project-ref fzvsbpgqfubbqmqqxmwv
```

## 4. Deploy la función

```powershell
supabase functions deploy make-server-b0e879f0
```

## 5. Verificar

```powershell
supabase functions list
```

---

## Comando Todo-en-Uno (después de obtener el token)

```powershell
# Reemplaza TU_TOKEN_AQUI con el token de Supabase
$env:SUPABASE_ACCESS_TOKEN = "TU_TOKEN_AQUI"
cd C:\Users\Usuario\Documents\Programs\fuelier
supabase link --project-ref fzvsbpgqfubbqmqqxmwv
supabase functions deploy make-server-b0e879f0
```

---

## ¿Dónde obtengo el token?

https://supabase.com/dashboard/account/tokens

Haz clic en "Generate new token" y copia el valor.
