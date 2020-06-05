from asynctest import mock
import spackle


async def test_can_get_the_list_of_packages(aiohttp_client):
    app = spackle.create_app()
    repodata_response = {"packages": {"aiohttp": {"name": "aiohttp_name"}}}
    #repodata_response = {"packages":{"aiohttp": {"version": "1.2.3"}}}
    app.service.packages = repodata_response
    client = await aiohttp_client(app)
    resp = await client.get("/packages")
    assert resp.status == 200
    package_list = await resp.json()
    #assert package_list == [{"name":"aiohttp", "version": "1.2.3"}]
    assert package_list == {"projects": {"aiohttp_name": {"packages": [{"package_name": "aiohttp"}]}}}

async def test_spackle_service_can_load_repodata(mocker):
    # Mock out the constructor, not the instance
    client_session_mock = mocker.patch('aiohttp.ClientSession')
    # Get a reference to the mock instance returned by the constructor
    mock_session = client_session_mock.return_value
    # Replace normal mock .get() with coroutine mock because we call await on self.http_client.get()
    mock_session.get = mock.CoroutineMock()
    # mock_session.get.return_value is our `response` in load_packages
    mock_response = mock_session.get.return_value
    # Replace json with a coroutine mock because we call await on response.json()
    mock_response.json = mock.CoroutineMock()
    # Finally now, we can replace the return value with the data that we want
    expected_packages = [{"name":"aiohttp", "version": "1.2.3"}]
    mock_response.json.return_value = expected_packages

    spackle_service = spackle.Spackle()
    await spackle_service.load_packages()
    assert spackle_service.packages == expected_packages
