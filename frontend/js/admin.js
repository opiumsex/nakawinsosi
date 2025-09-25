// Admin functionality for managing cases and wheel
class Admin {
    static async addCase(caseData) {
        const response = await fetch('/api/cases/admin/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add admin authentication in production
            },
            body: JSON.stringify(caseData)
        });
        return response.json();
    }

    static async updateWheel(segments) {
        const response = await fetch('/api/wheel/admin/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ segments })
        });
        return response.json();
    }
}