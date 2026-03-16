type ValidationResult = {
    valid: boolean;
    errors: string[];
};

type Rule = (row: any) => string | null;

const rules: Rule[] = [
    r => (!r.weighmentNumber ? 'Missing number' : null),
    r => (r.firstWeight < 0 ? 'Invalid weight' : null),
];

export function validateRow(row: any): ValidationResult {
    const errors = rules
        .map(rule => rule(row))
        .filter(Boolean) as string[];

    return { valid: errors.length === 0, errors };
}
