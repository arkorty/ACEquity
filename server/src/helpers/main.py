import concurrent.futures
import subprocess


def run_script(script_name):
    process = subprocess.Popen(
        ["python3", script_name],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    for line in process.stdout:
        print(f"[{script_name}] {line}", end="")

    stdout, stderr = process.communicate()

    if stderr:
        print(f"[{script_name} ERROR] {stderr}")

    if process.returncode != 0:
        print(f"Error running {script_name}: {stderr}")
    else:
        print(f"Finished running {script_name}")


if __name__ == "__main__":
    scripts = ["main1.py", "main2.py"]

    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(run_script, script) for script in scripts]
        concurrent.futures.wait(futures)

    run_script("process.py")
