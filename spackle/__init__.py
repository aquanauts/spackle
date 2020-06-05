import sys
import logging
import asyncio
from aiohttp import web
import aiohttp


class Spackle():
    def __init__(self):
        self.packages = {'packages': {}}
        self.http_client = aiohttp.ClientSession()

    def get_package_index(self):
        index = {"projects": {}}

        # transform self.packages into new dictioanry
        for package_name, package_info in self.packages['packages'].items():
            # check if project is in dictionary
            project_name = package_info['name']
            # when project exists in dictionary
            if project_name in index["projects"]:
                index["projects"][project_name]["packages"].append({"package_name": package_name})
            # when project does not exist in dictionary
            else:
                index["projects"][project_name] = {"packages": [{"package_name": package_name}]}

        return index

    async def get_packages(self, _):
        return web.json_response(data=self.get_package_index())

    # Use https://docs.aiohttp.org/en/stable/client.html
    # fetch packages from conda channels
    async def load_packages(self):
        url = 'https://repo.anaconda.com/pkgs/main/linux-64/repodata.json'
        logging.info("Loading packages from %s", url)
        response = await self.http_client.get(url)
        self.packages = await response.json()
        logging.info("Successfully received packages from %s", url)


def create_app():
    app = web.Application()
    app.service = Spackle()
    app.add_routes([web.get('/packages', app.service.get_packages)])
    return app


def main():
    logging.basicConfig(stream=sys.stdout, level=logging.INFO,
                        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",)
    logging.info("Starting spackle")
    # This code is untested
    app = create_app()
    asyncio.ensure_future(app.service.load_packages())
    web.run_app(app)
