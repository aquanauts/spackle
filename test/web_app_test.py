import spackle

async def test_can_get_the_list_of_packages(aiohttp_client):
    app = spackle.create_app()
    client = await aiohttp_client(app)
    resp = await client.get("/packages")
    assert resp.status == 200
    package_list = await resp.json()
    assert package_list == [{"name":"aiohttp", "current_version": "1.2.3"}]
