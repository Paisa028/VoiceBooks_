async function request(url, options = {}) {
    const response = await fetch(
        `/api${url}`,
        {
            ...options,

            // Uses the same HTTP-only authentication
            // cookie as the VoiceBooks login.
            credentials: "include",

            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        }
    );

    const result = await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Something went wrong"
        );
    }

    return result;
}


export const accountantApi = {

    dashboard: () =>
        request("/accountant/dashboard"),

    clients: () =>
        request("/accountant/clients"),

    client: (id) =>
        request(`/accountant/clients/${id}`),

    clientTransactions: (id) =>
        request(
            `/accountant/clients/${id}/transactions`
        ),

    pendingReviews: () =>
        request(
            "/accountant/reviews/pending"
        ),

    transactionReview: (id) =>
        request(
            `/accountant/transactions/${id}/review`
        ),

    approve: (id) =>
        request(
            `/accountant/transactions/${id}/approve`,
            {
                method: "PATCH"
            }
        ),

    reject: (id, reason) =>
        request(
            `/accountant/transactions/${id}/reject`,
            {
                method: "PATCH",
                body: JSON.stringify({ reason })
            }
        ),

    approved: () =>
        request("/accountant/approved"),

    returned: () =>
        request("/accountant/returned"),

    profile: () =>
        request("/accountant/profile")
};