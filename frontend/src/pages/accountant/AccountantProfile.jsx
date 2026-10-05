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
            <div className="loading" role="status">
                Loading profile...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-box" role="alert">
                {error}
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="error-box" role="alert">
                Profile not found.
            </div>
        );
    }

    const displayName =
        profile.name ||
        `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

   return (
    <main className="accountant-profile-page">

        <header className="accountant-profile-header">
            <div>
                <p className="accountant-profile-eyebrow">
                    ACCOUNTANT WORKSPACE
                </p>

                <h1>Accountant Profile</h1>

                <p className="accountant-profile-subtitle">
                    View your professional account information.
                </p>
            </div>
        </header>

        <section className="accountant-profile-card">

            <div className="accountant-profile-top">

                <div className="accountant-profile-avatar">
                    {displayName?.charAt(0).toUpperCase() || "A"}
                </div>

                <div className="accountant-profile-identity">
                    <h2>{displayName}</h2>

                    <p>Accounting Professional</p>

                    <span className="accountant-profile-role">
                        Accountant
                    </span>
                </div>

            </div>

            <div className="accountant-profile-divider" />

            <div className="accountant-profile-details">

                <div className="accountant-profile-field">
                    <span>FULL NAME</span>
                    <strong>{displayName}</strong>
                </div>

                <div className="accountant-profile-field">
                    <span>EMAIL ADDRESS</span>
                    <strong>{profile.email || "Not provided"}</strong>
                </div>

                <div className="accountant-profile-field">
                    <span>ACCOUNT ROLE</span>
                    <strong>Accountant</strong>
                </div>

                <div className="accountant-profile-field">
                    <span>ACCOUNT STATUS</span>

                    <div className="accountant-profile-status">
                        <i></i>
                        Active
                    </div>
                </div>

            </div>

        </section>

    </main>
);
}