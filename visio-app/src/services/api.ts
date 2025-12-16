const API_URL = "/api";

export const api = {
    login: async (email: string, password: string) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const text = await response.text();
            console.error("Login failed, status:", response.status, "content:", text);
            try {
                const error = JSON.parse(text);
                throw new Error(error.message || "Login failed");
            } catch (e) {
                throw new Error(text || "Login failed");
            }
        }
        return response.json();
    },

    register: async (userData: any) => {
        console.log("Sending register data:", userData);
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            try {
                const error = await response.json();
                throw new Error(error.message || "Registration failed");
            } catch {
                throw new Error("Registration failed");
            }
        }
        return response.json();
    }
};
