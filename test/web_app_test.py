import asyncio
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


async def test_can_get_the_list_of_project_names(aiohttp_client, repodata_response):
    app = spackle.create_app()
    app.service.organize_packages(repodata_response, 'main')
    client = await aiohttp_client(app)
    resp = await client.get("/project_names")
    assert resp.status == 200
    project_list = await resp.json()
    project_names = project_list['projects']
    assert "aiohttp" in project_names

async def test_can_get_static_content(aiohttp_client):
    app = spackle.create_app()
    client = await aiohttp_client(app)
    resp = await client.get("/tests/index.html")
    assert resp.status == 200


async def test_can_get_info_for_a_single_project(aiohttp_client, repodata_response):
    app = spackle.create_app()
    app.service.organize_packages(repodata_response, "main")
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


async def test_can_periodically_perform_a_task():
    task_fn = mock.CoroutineMock()
    task_fn.side_effect = lambda: asyncio.current_task().cancel()
    with pytest.raises(asyncio.CancelledError):
        task = await asyncio.wait_for(asyncio.create_task(spackle.periodic_task(task_fn, 0.0001)), 0.1)
        assert task.done()
    task_fn.assert_awaited()


async def test_periodic_task_can_handle_errors():
    async def task_fn():
        asyncio.current_task().cancel()
        raise Exception("Task Failed!")
    with pytest.raises(asyncio.CancelledError):
        await asyncio.wait_for(asyncio.create_task(spackle.periodic_task(task_fn, 0.0001)), 1)


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
