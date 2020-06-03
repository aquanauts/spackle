from aiohttp import web

async def get_packages(_):
    package_list = [{"name":"aiohttp", "current_version": "1.2.3"}]
    return web.json_response(data=package_list)


def create_app():
    app = web.Application()
    app.add_routes([web.get('/packages', get_packages)])
    return app


def main():
    web.run_app(create_app())
