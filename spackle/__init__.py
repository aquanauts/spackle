import os
import sys
import logging
import asyncio
import re
import urllib.parse
import datetime
from aiohttp import web
import aiohttp
from conda.models import version

WEB_ROOT = f"{os.path.dirname(os.path.abspath(__file__))}/../web/public"


async def periodic_task(task_fn, seconds=300):
    while not asyncio.current_task().cancelled():
        try:
            await task_fn()
            #pylint: disable=W0702
        except:
            logging.exception("Task failed")
        await asyncio.sleep(seconds)


class Spackle():
    def __init__(self):
        self.packages = {"main": [],
                         "free": [],
                         "conda-forge": [],
                         "bioconda": [],
                         "mosek": []}
        self.http_client = aiohttp.ClientSession()

    async def get_project_data(self, http_request):
        package_list = self.query_for_project_data(http_request)
        return web.json_response(data=package_list)

    def query_for_project_data(self, http_request):
        package_list = {'packages': []}
        for channel in self.packages:
            for channel_repodata in self.packages[channel]:
                arch_type = channel_repodata['info']['subdir']
                for package in channel_repodata['packages']:
                    package_info = channel_repodata['packages'][package]
                    project_name = package_info['name']
                    if project_name == http_request.query['project_name']:
                        # add archtype and channel to package info
                        package_info['subdir'] = arch_type
                        package_info['channel'] = channel
                        # append package to list
                        package_list['packages'].append({package: package_info})
        return package_list

    async def get_project_data_with_version(self, http_request):
        project_data = self.query_for_project_data(http_request)
        package_list = self.query_for_project_data_with_version(project_data, http_request)
        return web.json_response(data=package_list)

    def query_for_project_data_with_version(self, package_list, http_request):
        package_version_list = {'packages': []}
        for package in package_list['packages']:
            package_info = list(package.values())[0]
            package_name = list(package.keys())[0]
            project_version = package_info['version']
            # handle version range
            query_version = urllib.parse.unquote(http_request.query['version'])
            spec = version.VersionSpec(query_version)
            if spec.match(project_version):
                package_version_list['packages'].append({package_name: package_info})
        return package_version_list


    async def get_index(self, _):
        return web.FileResponse(WEB_ROOT + "/index.html")

    async def get_channels(self, _):
        channel_list = {"channels" : []}
        for channel in self.packages:
            for arch in self.packages[channel]:
                arch_type = arch["info"]["subdir"]
                timestamp = arch["timestamp"]
                url = arch["url"]
                size = len(arch["packages"])
                channel_list["channels"].append({channel: {"arch_type": arch_type,
                                                           "timestamp": timestamp,
                                                           "url": url,
                                                           "size": size}})
        return web.json_response(data=channel_list)

    # fetch packages from conda channels
    async def load_packages(self):
        self.packages = {"main": [],
                         "free": [],
                         "conda-forge": [],
                         "bioconda": [],
                         "mosek": []}
        channel_urls = ['https://repo.anaconda.com/pkgs/main/linux-64/repodata.json',
                        'https://repo.anaconda.com/pkgs/main/noarch/repodata.json',
                        'https://repo.anaconda.com/pkgs/free/linux-64/repodata.json',
                        'https://repo.anaconda.com/pkgs/free/noarch/repodata.json',
                        'https://conda.anaconda.org/conda-forge/noarch/repodata.json',
                        'https://conda.anaconda.org/conda-forge/linux-64/repodata.json',
                        'https://conda.anaconda.org/bioconda/linux-64/repodata.json',
                        'https://conda.anaconda.org/bioconda/noarch/repodata.json',
                        'https://conda.anaconda.org/mosek/linux-64/repodata.json',
                        'https://conda.anaconda.org/mosek/noarch/repodata.json']
        for url in channel_urls:
            channel = self.parse_channel_url(url)
            logging.info("Loading packages from %s", url)
            response = await self.http_client.get(url)
            self.organize_packages(await response.json(), channel, url)
            logging.info("Successfully received packages from %s", url)

    def organize_packages(self, channel_repodata, channel, url):
        timestamp = datetime.datetime.now()
        channel_repodata["timestamp"] = timestamp.strftime("%Y-%m-%d %H:%M:%S")
        channel_repodata["url"] = url
        self.packages[channel].append(channel_repodata)

    def parse_channel_url(self, url):
        url_split = url.split('/')
        if len(url_split) == 7:
            channel = url_split[4]
        if len(url_split) == 6:
            channel = url_split[3]
        return channel

    async def get_project_names(self, _):
        project_names = set()
        # iterate over each channel
        for channel in self.packages:
            # iterate over each architecture type
            for arch_type in self.packages[channel]:
                # gather data on each package
                for package_info in arch_type['packages'].values():
                    project_name = package_info['name']
                    project_names.add(project_name)
        return web.json_response(data={"projects": list(project_names)})


async def on_prepare(_, response):
    response.headers['cache-control'] = 'no-cache'


def create_app():
    app = web.Application()
    app.service = Spackle()
    app.on_response_prepare.append(on_prepare)
    app.add_routes([web.get('/project_names', app.service.get_project_names),
                    web.get('/project', app.service.get_project_data),
                    web.get('/version', app.service.get_project_data_with_version),
                    web.get('/channels', app.service.get_channels),
                    web.get("/", app.service.get_index),
                    web.static('/', WEB_ROOT)])
    return app

def main():
    logging.basicConfig(stream=sys.stdout, level=logging.INFO,
                        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",)
    logging.info("Starting spackle")
    # This code is untested
    app = create_app()
    asyncio.ensure_future(periodic_task(app.service.load_packages))
    web.run_app(app)
