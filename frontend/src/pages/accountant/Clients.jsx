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
        <main className="accountant-page">

            <header className="page-header">
                <p className="eyebrow">
                    CLIENT MANAGEMENT
                </p>

                <h1>
                    Clients
                </h1>

                <p>
                    View clients and their accounting
                    records.
                </p>
            </header>

            <section className="content-card">

                <input
                    className="search-input"
                    type="search"
                    placeholder="Search clients..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                />

                {loading ? (
                    <div className="loading">
                        Loading clients...
                    </div>
                ) : error ? (
                    <div className="error-box">
                        {error}
                    </div>
                ) : filteredClients.length === 0 ? (
                    <p>
                        No clients found.
                    </p>
                ) : (
                    <div className="client-grid">

                        {filteredClients.map(
                            client => (

                                <button
                                    type="button"
                                    className="client-card"
                                    key={client.id}
                                    onClick={() =>
                                        navigate(
                                            `/accountant/clients/${client.id}`
                                        )
                                    }
                                >

                                    <div className="client-avatar">
                                        {client.name
                                            ?.charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <div>
                                        <h3>
                                            {client.name}
                                        </h3>

                                        <p>
                                            {client.business_name}
                                        </p>

                                        <small>
                                            {client.email}
                                        </small>
                                    </div>

                                </button>

                            )
                        )}

                    </div>
                )}

            </section>

        </main>
    );
}