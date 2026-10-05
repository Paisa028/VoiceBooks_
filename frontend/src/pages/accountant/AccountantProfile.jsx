import { useEffect, useState } from "react";
import { accountantApi } from "../../services/accountantApi";

export default function AccountantProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadProfile() {
            try {
                setLoading(true);
                setError("");

                const result = await accountantApi.profile();

                setProfile(result.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, []);

    if (loading) {
        return (
            <div className="loading">
                Loading profile...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-box">
                {error}
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="error-box">
                Profile not found.
            </div>
        );
    }

    const displayName =
        profile.name ||
        `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

    return (
        <main className="accountant-page">

            <header className="page-header">
                <p className="eyebrow">
                    ACCOUNTANT WORKSPACE
                </p>

                <h1>
                    Accountant Profile
                </h1>
            </header>

            <section className="profile-card">

                <div className="profile-avatar">
                    {displayName
                        ?.charAt(0)
                        .toUpperCase()}
                </div>

                <h2>
                    {displayName}
                </h2>

                <p>
                    {profile.email}
                </p>

                <span className="role-badge">
                    Accountant
                </span>

            </section>

        </main>
    );
}