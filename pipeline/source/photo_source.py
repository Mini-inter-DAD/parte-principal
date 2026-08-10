import requests

class FootballApiService:
    BASE_URL = "https://cdn.futwiz.com/assets/img/fc26/faces"

    def get_photo(self, ea_id: int) -> str | None:
        url = f"{self.BASE_URL}/{ea_id}.png"
        response = requests.get(url)

        if response.status_code == 200 and "image" in response.headers.get("Content-Type", ""):
            return url

        return None      