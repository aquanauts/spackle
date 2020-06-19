import json
import pytest
from asynctest import mock
import spackle


@pytest.fixture(name="repodata_response")
def repodata_response_fixture():
    return {"info": {"subdir": "linux-64"},
            "packages": {"aiohttp-0.0.00-abcd": {
                "build": "0",
                "build_number": 0,
                "date": "0000-00-00",
                "depends": [],
                "license_family": "other",
                "md5": "abcd",
                "name": "aiohttp",
                "size": 0,
                "subdir": "linux-64",
                "version": "0.0.00"}}}


async def test_can_get_the_list_of_packages(aiohttp_client, repodata_response):
    app = spackle.create_app()
    app.service.populate_packages(repodata_response, 'main')
    client = await aiohttp_client(app)
    resp = await client.get("/packages")
    assert resp.status == 200
    package_list = await resp.json()
    assert "projects" in package_list
    projects = package_list['projects']
    assert "aiohttp" in projects
    aiohttp = projects['aiohttp']
    packages = aiohttp['packages']
    assert len(packages) == 1
    package1 = packages[0]
    assert package1 == {"package_name": "aiohttp-0.0.00-abcd",
                        "package_version": "0.0.00",
                        "package_build": "0",
                        "package_channel": "main",
                        "package_arch": "linux-64",
                        "package_size": 0,
                        "package_depends": []}


async def test_can_get_static_content(aiohttp_client):
    app = spackle.create_app()
    client = await aiohttp_client(app)
    resp = await client.get("/tests/index.html")
    assert resp.status == 200


async def test_can_get_info_for_a_single_project(aiohttp_client, repodata_response):
    app = spackle.create_app()
    app.service.populate_packages(repodata_response, "main")
    client = await aiohttp_client(app)
    resp = await client.get("/project?project_name=aiohttp")
    assert resp.status == 200
    text = await resp.text()
    project_info = json.loads(text)
    assert project_info == {'packages': [{
        "aiohttp-0.0.00-abcd": {
            "build": "0",
            "build_number": 0,
            "date": "0000-00-00",
            "depends": [],
            "license_family": "other",
            "md5": "abcd",
            "name": "aiohttp",
            "size": 0,
            "subdir": "linux-64",
            "channel": "main",
            "version": "0.0.00"}}]}



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
    expected_packages = {"name":"some package"}
    mock_response.json.return_value = expected_packages
    spackle_service = spackle.Spackle()
    await spackle_service.load_packages()
    assert list(spackle_service.packages.keys()) == ["main",
                                                     "free",
                                                     "conda-forge",
                                                     "bioconda",
                                                     "mosek"]
    main = spackle_service.packages["main"]
    assert main == [{"name":"some package"}, {"name":"some package"}]
