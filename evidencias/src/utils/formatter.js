export function formatAxe(violations) {
    return violations.map(v => ({
        id: v.id,
        impact: v.impact || 'low',
        description: v.description,
        nodes: v.nodes.length
    }));
}

export function getImpactColor(impact) {
    switch (impact) {
        case 'critical': return '#ff4d4f';
        case 'serious': return '#fa8c16';
        case 'moderate': return '#fadb14';
        default: return '#52c41a';
    }
}