deploy:
	@docker compose -f build.yml build && \
	ssh opc@compute.webark.in 'cd servers/acequity && \
	docker load -i image.tar && \
	docker compose -f deploy.yml up -d'
