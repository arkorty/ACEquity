deploy:
	@docker compose -f build.yml build && \
	docker save acequity:latest -o image.tar && \
	rsync -aPvz image.tar deploy.yml opc@compute.webark.in:servers/acequity/ && \
	ssh opc@compute.webark.in 'cd servers/acequity && docker load -i image.tar && docker compose -f deploy.yml up -d' && \
	rm image.tar
