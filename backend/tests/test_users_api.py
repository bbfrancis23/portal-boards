from fastapi.testclient import TestClient
from httpx import Response


def new_portal(client: TestClient, name: str = "Atrium") -> int:
    return client.post("/api/portals", json={"name": name}).json()["id"]


def set_default(client: TestClient, portal_id: int) -> Response:
    return client.put("/api/users/me/default-portal", json={"default_portal_id": portal_id})


def test_set_default_portal(client: TestClient) -> None:
    new_portal(client, "First")
    second = new_portal(client, "Second")

    response = set_default(client, second)

    assert response.status_code == 200
    assert response.json()["default_portal_id"] == second
    assert client.get("/api/users/me").json()["default_portal_id"] == second


def test_no_default_portal_at_first(client: TestClient) -> None:
    assert client.get("/api/users/me").json()["default_portal_id"] is None


def test_another_users_portal_cant_be_my_default(
    client: TestClient, bob_client: TestClient
) -> None:
    bobs = new_portal(bob_client, "Bob's")

    assert set_default(client, bobs).status_code == 404
    assert client.get("/api/users/me").json()["default_portal_id"] is None


def test_missing_portal_cant_be_my_default(client: TestClient) -> None:
    assert set_default(client, 999).status_code == 404


def test_portal_id_must_be_positive(client: TestClient) -> None:
    assert set_default(client, 0).status_code == 422


def test_deleting_the_default_portal_clears_it(client: TestClient) -> None:
    portal_id = new_portal(client)
    set_default(client, portal_id)

    assert client.delete(f"/api/portals/{portal_id}").status_code == 204

    assert client.get("/api/users/me").json()["default_portal_id"] is None
