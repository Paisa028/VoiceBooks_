import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountantApi } from "../../services/accountantApi";

export default function ClientManagement() {
    const navigate = useNavigate();

    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadClients() {
            try {
                setLoading(true);
                setError("");

                const result =
                    await accountantApi.clients();

                setClients(result.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadClients();
    }, []);

    const filteredClients =
        clients.filter(client =>
            `${client.name} ${client.business_name}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );

    return (
    <main className="accountant-clients-page">

        <header className="accountant-clients-header">
            <div>
                <p className="accountant-clients-eyebrow">
                    CLIENT MANAGEMENT
                </p>

                <h1>Clients</h1>

                <p className="accountant-clients-subtitle">
                    View clients and their accounting records.
                </p>
            </div>
        </header>

        <section className="accountant-clients-card">

            <div className="accountant-clients-toolbar">
                <div className="accountant-client-search">
                    <span>⌕</span>

                    <input
                        type="search"
                        placeholder="Search clients..."
                        aria-label="Search clients"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="accountant-client-count">
                    {filteredClients.length}{" "}
                    {filteredClients.length === 1 ? "client" : "clients"}
                </div>
            </div>

            {loading ? (
                <div className="accountant-clients-message" role="status">
                    Loading clients...
                </div>
            ) : error ? (
                <div className="accountant-clients-error" role="alert">
                    {error}
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="accountant-clients-empty">
                    <div className="accountant-clients-empty-icon">
                        ♙
                    </div>

                    <h3>No clients found</h3>

                    <p>
                        Businesses assigned to your accounting practice
                        will appear here.
                    </p>
                </div>
            ) : (
                <div className="accountant-client-grid">
                    {filteredClients.map((client) => (
                        <button
                            type="button"
                            className="accountant-client-card"
                            key={client.id}
                            onClick={() =>
                                navigate(`/accountant/clients/${client.id}`)
                            }
                        >
                            <div className="accountant-client-avatar">
                                {client.name?.charAt(0).toUpperCase() || "C"}
                            </div>

                            <div className="accountant-client-information">
                                <h3>{client.name}</h3>

                                <p>
                                    {client.business_name || "Business"}
                                </p>

                                <small>{client.email}</small>
                            </div>

                            <span className="accountant-client-arrow">
                                ›
                            </span>
                        </button>
                    ))}
                </div>
            )}

        </section>

    </main>
);
}