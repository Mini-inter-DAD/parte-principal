-- Índices de desempenho para as consultas mais frequentes do app.
-- Seguro para reaplicação em ambientes existentes.

-- Painel administrativo: usuários criados por período.
CREATE INDEX IF NOT EXISTS idx_users_created_at
    ON users (created_at);

-- Draft: histórico do usuário ordenado do mais recente para o mais antigo.
CREATE INDEX IF NOT EXISTS idx_matches_user_played_at_id
    ON matches (user_id, played_at DESC, id DESC);

-- Carrinho: listagem por usuário na ordem de inclusão e limpeza por usuário.
CREATE INDEX IF NOT EXISTS idx_cart_items_user_created_at_id
    ON cart_items (user_id, created_at ASC, id ASC);

-- Elenco: filtros recorrentes por usuário e status de titularidade.
CREATE INDEX IF NOT EXISTS idx_user_players_user_starter
    ON user_players (user_id, is_starter);

-- Cadastro: seleção de jogadores dentro da faixa de overall.
CREATE INDEX IF NOT EXISTS idx_players_overall
    ON players (overall);
