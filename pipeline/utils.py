import unicodedata

def normalizar_nome_acento(name: str):
    name = name.lower()
    
    normalizado = ''.join(
        c for c in unicodedata.normalize('NFD', name)
        if unicodedata.category(c) != 'Mn'
    )
    return normalizado
    